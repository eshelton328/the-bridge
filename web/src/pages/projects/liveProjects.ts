// The live source of the Projects page: its home in development and
// `?source=live` (as the Artifacts home, d-117). The loader reads the brain's
// projects from the-bridge server (`GET /api/projects`) through the typed RPC
// client and puts them on the home's cards, in the server's order: the pinned
// ones first, then by name (R2). A pin (`pinProject`) sends
// `PUT /api/projects/:slug/pin`; the entry then reads the list again, so the
// card moves (R3). The pins are a server file, so each device sees them.
// A project's page reads its project (`GET /api/projects/:slug`, R4); a slug
// the server does not know is not found.
//
// A read or a pin that misses shows one short line by status ("Projects not
// read — the server answered 500"), and a list that misses shows no projects,
// never the sample ones. report() gets only a miss the server answered, as
// `ProjectsMissError` with the step, kind and status, never a name. A reply the
// contract refuses throws, for RouteError.
import {
  ErrorBody,
  type ErrorKind,
  ProjectDetailResponse,
  ProjectsResponse,
  type ProjectSummary,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type { ProjectCard, ProjectsData, ProjectsUi } from './types.ts'

/** How long a read or a pin waits for the server, in ms, as the Artifacts reads do. */
const projectsTimeoutMs = 8000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
type ProjectsMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

type ProjectsStep = 'list' | 'pin' | 'detail'

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
  const answer = await send(
    (init) => api.api.projects[':slug'].$get({ param: { slug } }, { init: { signal: init } }),
    signal,
  )
  const ui = { ...state.ui, open: slug }
  if (!answer.ok) {
    if (answer.error.kind === 'not-found') return { ...state, ui, data: { ...state.data, projects: [], live: {} } }
    reportMiss('detail', answer.error)
    const notice = missLine('Project not read', answer.error)
    return { ...state, ui, data: { ...state.data, projects: [], live: {}, notice } }
  }
  const { project } = ProjectDetailResponse.parse(readJson(answer.value))
  return { ...state, ui, data: { ...state.data, projects: [projectCard(project)], live: {} } }
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
