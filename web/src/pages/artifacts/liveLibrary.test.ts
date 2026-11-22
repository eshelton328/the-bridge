import { ArtifactsResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { artifactsHome } from './home.ts'
import { ageOf, foundLine, liveLibrary } from './liveLibrary.ts'
import { noProject } from './types.ts'

// Made-up artifacts only: no real link, title or project.
const now = new Date('2026-03-10T12:00:00.000Z')
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

const plan = {
  id: '0000000000000001',
  link: 'https://claude.ai/artifact/00000000-0000-0000-0000-000000000001',
  source: 'claude',
  title: 'Sample plan',
  description: 'A plan made up for the test',
  project: 'sample-project',
  chat: 'mac-mini/s1',
  publishedAt: minutesAgo(5),
  foundAt: minutesAgo(5),
  foundBy: 'session',
} as const
const site = {
  id: '0000000000000002',
  link: 'https://sample-site.example.com/page',
  source: 'codex',
  title: 'Sample site',
  description: '',
  project: null,
  chat: null,
  publishedAt: minutesAgo(3 * 24 * 60),
  foundAt: minutesAgo(3 * 24 * 60),
  foundBy: 'owner',
} as const

const response = (lastSeenAt: string | null, partial = false) =>
  ArtifactsResponse.parse({ checkedAt: minutesAgo(2), lastSeenAt, partial, artifacts: [plan, site] })

describe('liveLibrary', () => {
  it('puts what the library found since the owner last looked first, and the rest under Earlier', () => {
    const data = liveLibrary(artifactsHome.data, response(minutesAgo(60)), { seenAt: minutesAgo(60), now })
    expect(data.count).toBe(2)
    expect(data.groups.map((g) => [g.id, g.count, g.dot, g.cards.map((c) => c.title)])).toEqual([
      ['found', 1, true, ['Sample plan']],
      ['earlier', 1, false, ['Sample site']],
    ])
    expect(data.chips.map((c) => [c.value, c.count])).toEqual([
      ['all', 2],
      ['claude', 1],
      ['codex', 1],
      ['new', 1],
    ])
    expect(data.found).toBe('Checked Claude 2m ago')
    expect(data.live).toEqual({ partial: false })
  })

  it('maps each artifact to a card with its link without the scheme, its age and no sample field', () => {
    const data = liveLibrary(artifactsHome.data, response(null), { seenAt: null, now })
    const cards = data.groups.flatMap((g) => g.cards)
    expect(cards).toEqual([
      {
        id: plan.id,
        title: 'Sample plan',
        description: 'A plan made up for the test',
        preview: 'doc',
        source: 'claude',
        sourceLabel: 'Claude',
        project: 'sample-project',
        age: '5m',
        isNew: true,
        link: 'claude.ai/artifact/00000000-0000-0000-0000-000000000001',
      },
      {
        id: site.id,
        title: 'Sample site',
        description: '',
        preview: 'ui',
        source: 'codex',
        sourceLabel: 'Codex site',
        project: noProject,
        age: '3d',
        isNew: true,
        link: 'sample-site.example.com/page',
      },
    ])
  })

  it('drops the scheme of a link whatever its case', () => {
    const shouting = { ...site, link: 'HTTPS://sample-site.example.com/page' }
    const data = liveLibrary(
      artifactsHome.data,
      ArtifactsResponse.parse({ checkedAt: minutesAgo(2), lastSeenAt: null, partial: false, artifacts: [shouting] }),
      { seenAt: null, now },
    )
    expect(data.groups.flatMap((g) => g.cards).map((c) => c.link)).toEqual(['sample-site.example.com/page'])
  })

  it('lists only the live projects in File in a project, the Filter menu and Add a link', () => {
    const data = liveLibrary(artifactsHome.data, response(null), { seenAt: null, now })
    expect(data.fileMenu?.projects).toEqual([{ value: 'sample-project', count: '1 artifact' }])
    expect(data.fileMenu?.none.count).toBe('1')
    expect(data.addLinkForm?.project.projects).toEqual(['sample-project'])
    expect(data.addLinkForm?.project.value).toBe(noProject)
    expect(data.addLinkForm?.project.none).toBe('Not in a project')
    const counts = data.filterMenu?.sections.flatMap((s) => s.items.map((i) => [i.value, i.count]))
    expect(counts).toEqual([
      ['source:claude', 1],
      ['source:codex', 1],
      ['project:sample-project', 1],
      ['project:none', 1],
      ['found:hook', 1],
      ['found:hand', 1],
      ['updated:today', 1],
      ['updated:week', 2],
    ])
  })

  it('says a partial read calmly, and marks it for one more read', () => {
    const data = liveLibrary(artifactsHome.data, response(null, true), { seenAt: null, now })
    expect(data.found).toBe('Checked part of Claude — the rest comes next')
    expect(data.live).toEqual({ partial: true })
  })
})

describe('ageOf and foundLine', () => {
  it('writes ages as the cards do', () => {
    expect(ageOf(minutesAgo(0), now)).toBe('1m')
    expect(ageOf(minutesAgo(59), now)).toBe('59m')
    expect(ageOf(minutesAgo(90), now)).toBe('1h')
    expect(ageOf(minutesAgo(2 * 24 * 60), now)).toBe('2d')
    expect(ageOf(minutesAgo(15 * 24 * 60), now)).toBe('2w')
  })

  it('says when the library last checked', () => {
    expect(foundLine(null, false, now)).toBe('Not checked yet')
    expect(foundLine(now.toISOString(), false, now)).toBe('Checked Claude just now')
  })
})
