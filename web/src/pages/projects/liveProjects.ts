// The live source of the Projects page: its home in development and
// `?source=live` (as the Artifacts home, d-117). The loader reads the brain's
// projects from the-bridge server (`GET /api/projects`) through the typed RPC
// client and puts them on the home's cards, in the server's order: the pinned
// ones first, then by name (R2). A pin (`pinProject`) sends
// `PUT /api/projects/:slug/pin`; the entry then reads the list again, so the
// card moves (R3). The pins are a server file, so each device sees them.
// A project's page reads its project (`GET /api/projects/:slug`, R4); a slug
// the server does not know is not found. Its open PRs are the Queue panel (R6),
// and the Inbox panel (R5) is the project's items of `GET /api/inbox`, read
// with it and again on each `inbox.changed` (ProjectPage.tsx; NCC-138).
// Its Ideas tab reads `GET /api/projects/:slug/ideas` only while it shows (R10).
//
// A read or a pin that misses shows one short line by status ("Projects not
// read — the server answered 500"), and a list that misses shows no projects,
// never the sample ones. report() gets only a miss the server answered, as
// `ProjectsMissError` with the step, kind and status, never a name. A reply the
// contract refuses throws, for RouteError.
import {
  ErrorBody,
  type ErrorKind,
  type Idea,
  IdeasResponse,
  ProjectDetailResponse,
  type ProjectPull,
  ProjectsResponse,
  type ProjectSummary,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { InboxMissError, readInboxList } from '../../lib/inboxClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type { IdeaRow, ProjectCard, ProjectOverview, ProjectsData, ProjectsUi } from './types.ts'

/** How long a read or a pin waits for the server, in ms, as the Artifacts reads do. */
const projectsTimeoutMs = 8000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
type ProjectsMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

type ProjectsStep = 'list' | 'pin' | 'detail' | 'ideas'

/** A miss for report(): a stable name and, in its message, only the step, the kind and the status. */
class ProjectsMissError extends Error {
  constructor(step: ProjectsStep, miss: ProjectsMiss) {
    super(
      `A projects request missed: ${step} ${miss.kind}${miss.status === undefined ? '' : ` ${String(miss.status)}`}`,
    )
    this.name = 'ProjectsMissError'
  }
}

function reportMiss(step: ProjectsStep, miss: ProjectsMiss): void {
  if (miss.status !== undefined) report(new ProjectsMissError(step, miss), 'live')
}

type Answer = { readonly ok: boolean; readonly status: number; text: () => Promise<string> }

const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const timedOut = (signal: AbortSignal) =>
  signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'

/** Sends one request with `projectsTimeoutMs` and gives the body text of a 2xx; another abort throws. */
async function send(
  call: (signal: AbortSignal) => Promise<Answer>,
  signal?: AbortSignal,
): Promise<Result<string, ProjectsMiss>> {
  const timeout = AbortSignal.timeout(projectsTimeoutMs)
  const both = signal === undefined ? timeout : AbortSignal.any([signal, timeout])
  try {
    const res = await call(both)
    const body = await res.text()
    if (res.ok) return ok(body)
    const error = ErrorBody.safeParse(readJson(body))
    return err({ kind: error.success ? error.data.error.kind : 'status', status: res.status })
  } catch (thrown) {
    if (timedOut(both)) return err({ kind: 'timeout', status: undefined })
    if (thrown instanceof TypeError && !both.aborted) return err({ kind: 'unreachable', status: undefined })
    throw thrown
  }
}

/** The line of a miss: what did not happen, then why, by status. */
const missLine = (lead: string, miss: ProjectsMiss) =>
  miss.status === undefined
    ? `${lead} — the server did not answer`
    : `${lead} — the server answered ${String(miss.status)}`

/** A card from the server's summary. */
const projectCard = (p: ProjectSummary): ProjectCard => ({
  slug: p.slug,
  name: p.name,
  purpose: p.purpose,
  icon: p.icon,
  pinned: p.pinned,
})

type ProjectsState = ScreenState<ProjectsData, ProjectsUi>

/** How long ago `iso` was at `now`, short, as the Inbox rows write it: "4m", "3h", "2d", "1w". */
function ageOf(iso: string, now: Date): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - Date.parse(iso)) / 60_000))
  if (minutes < 60) return `${String(minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)}h`
  const days = Math.floor(hours / 24)
  return days < 7 ? `${String(days)}d` : `${String(Math.floor(days / 7))}w`
}

export type ProjectInbox = { readonly inbox: ProjectOverview['inbox']; readonly count: number | undefined }

/**
 * The Inbox panel (R5): project `slug`'s items, as the Inbox page groups them, and the needs-you count. On a miss the
 * panel has no rows and the miss's line, and the count is undefined.
 */
export async function readProjectInbox(slug: string, signal?: AbortSignal): Promise<ProjectInbox> {
  const answer = await readInboxList('list', signal)
  if (!answer.ok) {
    if (answer.error.status !== undefined) report(new InboxMissError('list', answer.error), 'live')
    return {
      inbox: { needsYou: [], toReview: [], notRead: missLine('Inbox not read', answer.error) },
      count: undefined,
    }
  }
  const now = new Date()
  const row = (i: (typeof answer.value.items)[number]) => ({
    kind: i.kind,
    title: i.title,
    meta: slug,
    age: ageOf(i.createdAt, now),
  })
  const mine = answer.value.items.filter((i) => i.project === slug)
  const needsYou = mine.filter((i) => i.needsYou).map(row)
  // The Inbox page's To review (liveList.ts): not needing the owner and not snoozed. Since #559 a chat's item names
  // its pane's tagged project, so a done chat shows here.
  const toReview = mine.filter((i) => !i.needsYou && i.snoozedUntil === null).map(row)
  return { inbox: { needsYou, toReview }, count: answer.value.counts.needsYou }
}

const pullRow = (p: ProjectPull) => ({ title: p.title, meta: `${p.repository}#${String(p.number)}`, status: p.status })

/** `state` with the server's projects in place of the sample ones, or with none and the miss's line. */
export async function withLiveProjects(
  state: ProjectsState,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const answer = await send((init) => api.api.projects.$get(undefined, { init: { signal: init } }), signal)
  if (!answer.ok) {
    reportMiss('list', answer.error)
    return {
      ...state,
      data: { ...state.data, projects: [], live: {}, notice: missLine('Projects not read', answer.error) },
    }
  }
  const { projects } = ProjectsResponse.parse(readJson(answer.value))
  return { ...state, data: { ...state.data, projects: projects.map(projectCard), live: {} } }
}

/**
 * `state` with the server's project `slug` as its one card, open; with no card and the miss's line when the read
 * missed, or with no card when the server does not know the slug, so the loader says it is not found.
 */
export async function withLiveProject(
  state: ProjectsState,
  slug: string,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const [answer, inbox] = await Promise.all([
    send((init) => api.api.projects[':slug'].$get({ param: { slug } }, { init: { signal: init } }), signal),
    readProjectInbox(slug, signal),
  ])
  const ui = { ...state.ui, open: slug }
  if (!answer.ok) {
    if (answer.error.kind === 'not-found') return { ...state, ui, data: { ...state.data, projects: [], live: {} } }
    reportMiss('detail', answer.error)
    const notice = missLine('Project not read', answer.error)
    return { ...state, ui, data: { ...state.data, projects: [], live: {}, notice } }
  }
  const { project, queue } = ProjectDetailResponse.parse(readJson(answer.value))
  const overview = {
    inbox: inbox.inbox,
    queue: {
      inProgress: queue.inProgress.map(pullRow),
      ...(queue.unread.length === 0 ? {} : { unread: `PRs not read: ${queue.unread.join(', ')}` }),
    },
  }
  return { ...state, ui, data: { ...state.data, projects: [projectCard(project)], live: {}, overview } }
}

const ideaRow = (i: Idea, now: Date): IdeaRow => ({
  id: i.id,
  title: i.title,
  tags: i.tags,
  kind: i.kind,
  state: i.state,
  age: ageOf(i.updated, now),
})

/** `state` with project `slug`'s Ideas tab (R10); a list that misses shows no rows and its line. */
export async function withLiveIdeas(
  state: ProjectsState,
  slug: string,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const now = new Date()
  const answer = await send(
    (init) => api.api.projects[':slug'].ideas.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    reportMiss('ideas', answer.error)
    return { ...state, data: { ...state.data, ideas: { rows: [], notRead: missLine('Ideas not read', answer.error) } } }
  }
  const { ideas } = IdeasResponse.parse(readJson(answer.value))
  return { ...state, data: { ...state.data, ideas: { rows: ideas.map((i) => ideaRow(i, now)) } } }
}

/** Pins or unpins the project `slug` (`PUT /api/projects/:slug/pin`); a miss gives its line. */
export async function pinProject(slug: string, pinned: boolean): Promise<Result<void, string>> {
  const sent = await send((signal) =>
    api.api.projects[':slug'].pin.$put({ param: { slug }, json: { pinned } }, { init: { signal } }),
  )
  if (sent.ok) return ok(undefined)
  reportMiss('pin', sent.error)
  return err(missLine(pinned ? 'Not pinned' : 'Not unpinned', sent.error))
}
