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
// with it and again on each `inbox.changed` (ProjectPage.tsx; NCC-138), as is
// the Chats panel (R7, `GET /api/projects/:slug/chats`) on the Overview tab.
// Its Ideas tab reads `GET /api/projects/:slug/ideas` only while it shows,
// and an idea's page `GET /api/projects/:slug/ideas/:id` (R10, R11); an
// idea the server does not know is not found. Its Repositories tab reads
// `GET /api/projects/:slug/repositories` (increment two), its Architecture tab
// `GET /api/projects/:slug/architecture` and the shown scope's
// `.../architecture/:scope` (increment two, R9, R10), and its QA tab
// `GET /api/projects/:slug/qa` (increment three), each only while it shows.
// The Context drift panel (R9) reads the last check with it; Run check is `runDrift`.
//
// A read or a pin that misses shows one short line by status ("Projects not
// read — the server answered 500"), and a list that misses shows no projects,
// never the sample ones. report() gets only a miss the server answered, as
// `ProjectsMissError` with the step, kind and status, never a name. A reply the
// contract refuses throws, for RouteError.
import {
  ArchitectureResponse,
  ArchitectureScopeResponse,
  type ArchitectureScopeState,
  DriftResponse,
  type DriftRun,
  ErrorBody,
  type ErrorKind,
  type Idea,
  IdeaDetailResponse,
  IdeasResponse,
  ProjectChatsResponse,
  ProjectDetailResponse,
  type ProjectPull,
  ProjectsResponse,
  type ProjectSummary,
  QaListResponse,
  RepositoriesResponse,
  RepositoryCiResponse,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { InboxMissError, readInboxList } from '../../lib/inboxClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type {
  IdeaRow,
  ProjectArchitecture,
  ProjectCard,
  ProjectDrift,
  ProjectOverview,
  ProjectsData,
  ProjectsUi,
} from './types.ts'

/** How long a read or a pin waits for the server, in ms, as the Artifacts reads do. */
const projectsTimeoutMs = 8000
/** How long Run check waits: more than the server's 60 s limit of a check, so a slow check is not a miss. */
const driftRunTimeoutMs = 75_000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
type ProjectsMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

type ProjectsStep =
  | 'list'
  | 'pin'
  | 'detail'
  | 'ideas'
  | 'idea'
  | 'repositories'
  | 'ci'
  | 'qa'
  | 'drift'
  | 'runDrift'
  | 'chats'
  | 'architecture'
  | 'diagram'

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

/** Sends one request with `timeoutMs` and gives the body text of a 2xx; another abort throws. */
async function send(
  call: (signal: AbortSignal) => Promise<Answer>,
  signal?: AbortSignal,
  timeoutMs = projectsTimeoutMs,
): Promise<Result<string, ProjectsMiss>> {
  const timeout = AbortSignal.timeout(timeoutMs)
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

/** The Context drift panel's words. */
const driftWords = {
  title: 'Context drift',
  scope: 'Folder layout and hooks.',
  run: 'Run check',
  running: 'Checking…',
} as const

/** The panel of the last run (null before the first) at `now`. A failed run's code stays in the server's log. */
function driftView(last: DriftRun | null, now: Date): ProjectDrift {
  if (last === null) return { ...driftWords, checked: 'Not checked yet', findings: [] }
  const fresh = now.getTime() - Date.parse(last.checkedAt) < 60_000
  const checked = fresh ? 'Checked just now' : `Checked ${ageOf(last.checkedAt, now)} ago`
  const findings = [...new Set(last.findings.map((f) => f.text))]
  if (last.result === 'findings') return { ...driftWords, checked, findings }
  const empty = last.result === 'clean' ? 'No drift found' : 'The check did not run'
  return { ...driftWords, checked, findings, empty }
}

/** The Context drift panel (R9): project `slug`'s last check; on a miss no check and the miss's line. */
async function readDrift(slug: string, signal?: AbortSignal): Promise<ProjectDrift> {
  const answer = await send(
    (init) => api.api.projects[':slug'].drift.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    reportMiss('drift', answer.error)
    return { ...driftWords, findings: [], notRead: missLine('Drift not read', answer.error) }
  }
  return driftView(DriftResponse.parse(readJson(answer.value)).last, new Date())
}

/** Runs the layout check of project `slug` (Run check, R9) and gives the panel of its run, or the miss's line. */
export async function runDrift(slug: string): Promise<Result<ProjectDrift, string>> {
  const sent = await send(
    (signal) => api.api.projects[':slug'].drift.$post({ param: { slug }, json: {} }, { init: { signal } }),
    undefined,
    driftRunTimeoutMs,
  )
  if (!sent.ok) {
    reportMiss('runDrift', sent.error)
    return err(missLine('Check not run', sent.error))
  }
  return ok(driftView(DriftResponse.parse(readJson(sent.value)).last, new Date()))
}

export type ProjectChats = NonNullable<ProjectOverview['chats']>

/** The Chats panel (R7): `slug`'s tagged chats but shells (Workspaces links chat panes only), or the miss's line. */
export async function readProjectChats(slug: string, signal?: AbortSignal): Promise<ProjectChats> {
  const answer = await send(
    (init) => api.api.projects[':slug'].chats.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    if (answer.error.kind !== 'not-found') reportMiss('chats', answer.error)
    return { rows: [], notRead: missLine('Chats not read', answer.error) }
  }
  const { chats } = ProjectChatsResponse.parse(readJson(answer.value))
  return {
    rows: chats
      .filter((c) => c.kind !== 'shell')
      .map((c) => ({
        ...{ id: c.id, title: c.title, workspace: c.workspace.label, status: c.status },
        tags: c.tags.filter((t) => t.key !== 'project').map((t) => `${t.key}/${t.value}`),
      })),
  }
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
 * missed, or with no card when the server does not know the slug, so the loader says it is not found. With `chats`
 * false (the Ideas tab) it reads no chats: each chats read sends herdr list calls.
 */
export async function withLiveProject(
  state: ProjectsState,
  slug: string,
  { signal, chats: readChats = true }: { readonly signal?: AbortSignal | undefined; readonly chats?: boolean } = {},
): Promise<ProjectsState> {
  const [answer, inbox, drift, chats] = await Promise.all([
    send((init) => api.api.projects[':slug'].$get({ param: { slug } }, { init: { signal: init } }), signal),
    readProjectInbox(slug, signal),
    readDrift(slug, signal),
    readChats ? readProjectChats(slug, signal) : undefined,
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
    drift,
    ...(chats === undefined ? {} : { chats }),
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

/**
 * `state` with project `slug`'s Ideas tab (R10), or with the idea `idea`'s page (R11) when it is set. A list that
 * misses shows no rows and its line; an idea the server does not know keeps `ui.idea` with no page, so the loader
 * says it is not found, and another miss shows the list's place with the miss's line.
 */
export async function withLiveIdeas(
  state: ProjectsState,
  slug: string,
  idea: string | undefined,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const now = new Date()
  if (idea !== undefined) {
    const answer = await send(
      (init) => api.api.projects[':slug'].ideas[':id'].$get({ param: { slug, id: idea } }, { init: { signal: init } }),
      signal,
    )
    if (answer.ok) {
      const read = IdeaDetailResponse.parse(readJson(answer.value))
      return {
        ...state,
        ui: { ...state.ui, idea },
        data: { ...state.data, idea: { row: ideaRow(read.idea, now), body: read.body, file: read.file } },
      }
    }
    if (answer.error.kind === 'not-found') return { ...state, ui: { ...state.ui, idea } }
    reportMiss('idea', answer.error)
    return { ...state, data: { ...state.data, ideas: { rows: [], notRead: missLine('Idea not read', answer.error) } } }
  }
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

/**
 * The project's Repositories tab (increment two, R2, R8) from `GET /api/projects/:slug/repositories`, in
 * `project.yaml` order; a part the server could not read stays named in `unread`, and a miss gives its line.
 */
export async function withLiveRepositories(
  state: ProjectsState,
  slug: string,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const answer = await send(
    (init) => api.api.projects[':slug'].repositories.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    reportMiss('repositories', answer.error)
    const notRead = missLine('Repositories not read', answer.error)
    return { ...state, data: { ...state.data, repositories: { rows: [], notRead } } }
  }
  const { repositories } = RepositoriesResponse.parse(readJson(answer.value))
  const now = new Date()
  const rows = await Promise.all(
    repositories.map(async (r) => ({
      id: r.id,
      role: r.role,
      visibility: r.visibility,
      release: r.release?.tag ?? null,
      openPulls: r.openPulls,
      worktrees: r.worktrees,
      unread: r.unread,
      ...(r.github === null ? {} : { ci: await readRepositoryCi(slug, r.id, now, signal) }),
    })),
  )
  return { ...state, data: { ...state.data, repositories: { rows } } }
}

/** The shown scope's caption (R10): its view, the diagram's commit (7 characters) and its day; null with none. */
function captionOf(state: ArchitectureScopeState, view: string | undefined, words: ProjectsData['page']['arch']) {
  if (state.commit === null || state.generatedAt === null || view === undefined) return null
  return words.caption
    .replace('{view}', view)
    .replace('{commit}', state.commit.slice(0, 7))
    .replace('{date}', state.generatedAt.slice(0, 10))
}

/**
 * The project's Architecture tab (increment two, R9, R10): the scopes of `GET /api/projects/:slug/architecture`
 * as chips (System, then each repository), and the shown scope's kept diagram from `.../architecture/:scope`. A
 * scope the list does not have shows the first one; a miss of either read gives its line.
 */
export async function withLiveArchitecture(
  state: ProjectsState,
  slug: string,
  scope: string | undefined,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const words = state.data.page.arch
  const missed = (step: 'architecture' | 'diagram', miss: ProjectsMiss, chips: ProjectArchitecture['chips']) => {
    reportMiss(step, miss)
    const line = missLine(step === 'architecture' ? 'Architecture not read' : 'Diagram not read', miss)
    const architecture = { chips, scope: scope ?? '@system', title: '', caption: null, running: false, model: null }
    return { ...state, data: { ...state.data, architecture: { ...architecture, notRead: line } } }
  }
  const list = await send(
    (init) => api.api.projects[':slug'].architecture.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!list.ok) return missed('architecture', list.error, [])
  const { scopes } = ArchitectureResponse.parse(readJson(list.value))
  const chips = scopes.map((s) => ({ value: s.scope, label: s.scope === '@system' ? words.system : s.scope }))
  const shown = scopes.find((s) => s.scope === scope) ?? scopes[0]
  if (shown === undefined) return missed('architecture', { kind: 'status', status: undefined }, chips)
  const one = await send(
    (init) =>
      api.api.projects[':slug'].architecture[':scope'].$get(
        { param: { slug, scope: shown.scope } },
        { init: { signal: init } },
      ),
    signal,
  )
  if (!one.ok) return missed('diagram', one.error, chips)
  const read = ArchitectureScopeResponse.parse(readJson(one.value))
  const view = read.model === null ? undefined : words.views[read.model.view]
  const architecture = {
    chips,
    scope: read.state.scope,
    title: read.state.title,
    caption: captionOf(read.state, view, words),
    running: read.state.running,
    model: read.model,
  }
  return { ...state, data: { ...state.data, architecture } }
}

/** How old a CI read may be before its row says "as of" (the contract's 10 minutes). */
const ciFreshMs = 10 * 60_000

/**
 * Repository `repo`'s kept CI numbers (`GET /api/projects/:slug/repositories/:repo/ci`, R4): null when not read or
 * when the read misses, `runs` null while the server's first read runs. The page reads them again on each
 * `projects.changed`, which follows a CI read's end (ProjectPage.tsx).
 */
async function readRepositoryCi(slug: string, repo: string, now: Date, signal: AbortSignal | undefined) {
  const answer = await send(
    (init) =>
      api.api.projects[':slug'].repositories[':repo'].ci.$get({ param: { slug, repo } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    reportMiss('ci', answer.error)
    return null
  }
  const { ci, readAt, reading } = RepositoryCiResponse.parse(readJson(answer.value))
  if (ci === null) return reading ? { runs: null, runMinutes: null, asOf: null } : null
  const old = readAt !== null && now.getTime() - Date.parse(readAt) > ciFreshMs
  return { runs: ci.runs, runMinutes: ci.runMinutes, asOf: old ? ageOf(readAt, now) : null }
}

/** The project's QA tab (increment three, R2 to R4) from `GET /api/projects/:slug/qa`; a miss gives its line. */
export async function withLiveQa(
  state: ProjectsState,
  slug: string,
  { signal }: { readonly signal?: AbortSignal | undefined } = {},
): Promise<ProjectsState> {
  const answer = await send(
    (init) => api.api.projects[':slug'].qa.$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  if (!answer.ok) {
    reportMiss('qa', answer.error)
    return { ...state, data: { ...state.data, qa: { rows: [], notRead: missLine('QA items not read', answer.error) } } }
  }
  const { items } = QaListResponse.parse(readJson(answer.value))
  return { ...state, data: { ...state.data, qa: { rows: items } } }
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
