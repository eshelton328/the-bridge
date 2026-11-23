// The live library as the page draws it: the server's artifacts
// (`GET /api/artifacts`) mapped onto the home's words. The home keeps its
// layout words (the title, the chips' and groups' labels, the sorts, the
// menus' headings); every count, card, project and the status line come from
// the server. An artifact is new when the library found it after the owner
// last looked (`seenAt`, the first list of the visit; none before the first
// look, so every artifact is new then). The server has no preview of an
// artifact, so a Claude artifact's card draws the library's `doc` thumbnail
// and a Codex site's the `ui` one. An artifact in no project has the
// `noProject` value and its meta line names no project. Pure; tested in
// liveLibrary.test.ts.
import type { Artifact, ArtifactsResponse } from '@bridge/contract'
import { type ArtifactCard, type ArtifactsData, noProject } from './types.ts'

const minute = 60_000

/** How long ago `iso` was at `now`, short, as the cards write it: "1m", "3h", "2d", "1w". At least 1m. */
export function ageOf(iso: string, now: Date): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - Date.parse(iso)) / minute))
  if (minutes < 60) return `${String(minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)}h`
  const days = Math.floor(hours / 24)
  return days < 7 ? `${String(days)}d` : `${String(Math.floor(days / 7))}w`
}

/** The status line while the page reads the library for the first time (R58): the loading screen's own words. */
export const checkingLine = 'Checking Claude'

/** The status line for a list read at `checkedAt`: when the library last checked Claude's chats, or that it goes on. */
export function foundLine(checkedAt: string | null, partial: boolean, now: Date): string {
  if (partial) return 'Checked part of Claude — the rest comes next'
  if (checkedAt === null) return 'Not checked yet'
  const minutes = Math.floor((now.getTime() - Date.parse(checkedAt)) / minute)
  return minutes < 1 ? 'Checked Claude just now' : `Checked Claude ${ageOf(checkedAt, now)} ago`
}

const sourceLabel = { claude: 'Claude', codex: 'Codex site' } as const

/** Whether the library found `artifact` after the owner last looked (`seenAt`); every one before the first look. */
const isNew = (artifact: Artifact, seenAt: string | null) =>
  seenAt === null || Date.parse(artifact.foundAt) > Date.parse(seenAt)

/** One artifact's card. */
function liveCard(artifact: Artifact, seenAt: string | null, now: Date): ArtifactCard {
  return {
    id: artifact.id,
    title: artifact.title,
    description: artifact.description,
    preview: artifact.source === 'claude' ? 'doc' : 'ui',
    source: artifact.source,
    sourceLabel: sourceLabel[artifact.source],
    project: artifact.project ?? noProject,
    age: ageOf(artifact.publishedAt, now),
    isNew: isNew(artifact, seenAt),
    // The scheme is case-blind (`HTTPS://` is a valid link); the page puts `https://` back when it opens the link.
    link: artifact.link.replace(/^https:\/\//i, ''),
  }
}

const countOf = <T>(items: readonly T[], test: (item: T) => boolean) => items.filter(test).length
const artifactsCount = (n: number) => `${String(n)} ${n === 1 ? 'artifact' : 'artifacts'}`

/** The projects of the library's cards, A to Z, with how many artifacts each holds. */
function projectsOf(cards: readonly ArtifactCard[]): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const card of cards)
    if (card.project !== noProject) counts.set(card.project, (counts.get(card.project) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([value, count]) => ({ value, count }))
}

/** The Filter menu's sections with the library's counts; a box the live library cannot fill is left out. */
function liveFilterMenu(
  menu: NonNullable<ArtifactsData['filterMenu']>,
  artifacts: readonly Artifact[],
  cards: readonly ArtifactCard[],
  now: Date,
): ArtifactsData['filterMenu'] {
  const day = 24 * 60 * minute
  const age = (a: Artifact) => now.getTime() - Date.parse(a.publishedAt)
  const counts: Record<string, number> = {
    'source:claude': countOf(cards, (c) => c.source === 'claude'),
    'source:codex': countOf(cards, (c) => c.source === 'codex'),
    'project:none': countOf(cards, (c) => c.project === noProject),
    'found:hook': countOf(artifacts, (a) => a.foundBy === 'session'),
    'found:hand': countOf(artifacts, (a) => a.foundBy === 'owner'),
    'updated:today': countOf(artifacts, (a) => age(a) < day),
    'updated:week': countOf(artifacts, (a) => age(a) < 7 * day),
  }
  const projects = projectsOf(cards).map((p) => ({
    value: `project:${p.value}`,
    label: p.value,
    count: p.count,
    mono: true,
  }))
  const sections = menu.sections.map((section) => {
    const isProjects = section.items.some((item) => item.value.startsWith('project:'))
    const kept = section.items
      .filter((item) => Object.hasOwn(counts, item.value))
      .map((item) => ({
        ...item,
        // Not in a project gets its own value, so a project named "none" (`project:none`) is not taken for it.
        ...(item.value === 'project:none' ? { value: `project:${noProject}` } : {}),
        count: counts[item.value] ?? 0,
      }))
    return { ...section, items: isProjects ? [...projects, ...kept] : kept }
  })
  return { ...menu, sections, note: 'All artifacts', show: `Show ${String(cards.length)}` }
}

/** The home's data with the server's library in place of the sample one. */
export function liveLibrary(
  home: ArtifactsData,
  response: ArtifactsResponse,
  { seenAt, now }: { seenAt: string | null; now: Date },
): ArtifactsData {
  const cards = response.artifacts.map((a) => liveCard(a, seenAt, now))
  const found = cards.filter((c) => c.isNew)
  const earlier = cards.filter((c) => !c.isNew)
  const chipCounts = {
    all: cards.length,
    claude: countOf(cards, (c) => c.source === 'claude'),
    codex: countOf(cards, (c) => c.source === 'codex'),
    new: found.length,
  }
  const projects = projectsOf(cards)
  const withProjects = (form: ArtifactsData['addLinkForm']) =>
    form === undefined
      ? undefined
      : {
          ...form,
          project: {
            ...form.project,
            value: noProject,
            projects: projects.map((p) => p.value),
            ...(home.fileMenu === undefined ? {} : { none: home.fileMenu.none.label }),
          },
        }
  return {
    ...home,
    count: cards.length,
    found: foundLine(response.checkedAt, response.partial, now),
    chips: home.chips.map((chip) => ({ ...chip, count: chipCounts[chip.value] })),
    groups: home.groups.map((group) => {
      const groupCards = group.id === 'found' ? found : earlier
      return { ...group, count: groupCards.length, dot: group.id === 'found' && found.length > 0, cards: groupCards }
    }),
    filterMenu:
      home.filterMenu === undefined ? undefined : liveFilterMenu(home.filterMenu, response.artifacts, cards, now),
    fileMenu:
      home.fileMenu === undefined
        ? undefined
        : {
            ...home.fileMenu,
            none: { ...home.fileMenu.none, count: String(countOf(cards, (c) => c.project === noProject)) },
            projects: projects.map((p) => ({ value: p.value, count: artifactsCount(p.count) })),
          },
    addLinkForm: withProjects(home.addLinkForm),
    addLinkSheet: withProjects(home.addLinkSheet),
    live: { partial: response.partial },
  }
}
