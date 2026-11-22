// The live source of the Artifacts page: its home in development and
// `?source=live` (as the Workspaces home, d-117). The loader reads the
// library from the-bridge server (`GET /api/artifacts`) through the typed
// RPC client and maps it onto the home (liveLibrary.ts); the Discussion and
// its proposals stay the sample ones, as no server route has them.
//
// A visit is the page's time on screen (`enterVisit`, from ArtifactsPage).
// Its first list fixes what is new (`seenAt`): the server's `lastSeenAt`
// then. The page then posts `POST /api/artifacts/seen` once, so the next
// visit's "Found since you last looked" starts from this one, and every list
// of this visit keeps the same New marks.
//
// A list that says `partial: true` (the server's scan stopped at its cap) shows
// what came; the page reads once more (`takeFollowUp`), and a second partial
// list waits for the next list the owner causes. No read runs on a timer.
//
// A list that misses shows no artifacts, never the sample ones, and one short
// line by status in the library's status line. report() gets only a miss with
// an answer from the server, by its step, kind and status, never a link, a
// title or the server's message. A list read with no answer at all while the
// page is hidden, after it hid during the read or within 5 s after it showed
// again is iOS closing it in the background (lib/pageResume.ts): no line and
// no report, and the list is read again once the page shows; one such miss
// for each trip. A reply the contract refuses throws, for RouteError.
//
// The writes (`addArtifact`, `fileArtifact`, `removeArtifact`) send Add a link,
// a project pick and Remove; each answers either what happened or the miss's
// line ("Not added — the server answered 500"). An add answers 201 for a new
// link and 200 with the library's own entry for a link it has. A 400 add and a
// 404 file are the owner's to fix and are not reported; a 404 remove found the
// artifact gone already, which is what Remove wanted.
import { AddArtifactResponse, ArtifactsResponse, ErrorBody, type ErrorKind } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import {
  followPageVisibility,
  fromBackground,
  hidesSoFar,
  isHidden,
  type ResumeMark,
  resumeMark,
  whenVisible,
} from '../../lib/pageResume.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { liveLibrary } from './liveLibrary.ts'
import { type AddLinkInput, type ArtifactsData, type ArtifactsUi, noProject } from './types.ts'

/** How long a read or a write waits for the server, in ms, as the Workspaces reads do (d-101). */
const artifactsTimeoutMs = 8000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
type ArtifactsMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

/** A step of the page that reads or writes the server. */
type ArtifactsStep = 'list' | 'seen' | 'add' | 'file' | 'remove'

/** A miss for report(): a stable name and, in its message, only the step, the kind and the status. */
class ArtifactsMissError extends Error {
  readonly miss: string

  constructor(step: ArtifactsStep, miss: ArtifactsMiss) {
    const what = `${step} ${miss.kind}${miss.status === undefined ? '' : ` ${String(miss.status)}`}`
    super(`An artifacts request missed: ${what}`)
    this.name = 'ArtifactsMissError'
    this.miss = what
  }
}

/** Reports a miss that the server answered; one with no answer is the line's alone. */
function reportMiss(step: ArtifactsStep, miss: ArtifactsMiss): void {
  if (miss.status !== undefined) report(new ArtifactsMissError(step, miss), 'live')
}

/** What a request needs of the RPC client's answer. */
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

/**
 * Sends one request through the RPC client (`call`) with `artifactsTimeoutMs`, and gives the answer's body text on a
 * 2xx. A failed request (`TypeError`) is `unreachable`, the timeout `timeout`, and an error status the error body's
 * kind, or `status` when it has none. Any other abort, such as the owner leaving the page, throws.
 */
async function send(
  call: (signal: AbortSignal) => Promise<Answer>,
  signal?: AbortSignal,
): Promise<Result<{ status: number; body: string }, ArtifactsMiss>> {
  const timeout = AbortSignal.timeout(artifactsTimeoutMs)
  const both = signal === undefined ? timeout : AbortSignal.any([signal, timeout])
  try {
    const res = await call(both)
    const body = await res.text()
    if (res.ok) return ok({ status: res.status, body })
    const error = ErrorBody.safeParse(readJson(body))
    return err({ kind: error.success ? error.data.error.kind : 'status', status: res.status })
  } catch (thrown) {
    if (timedOut(both)) return err({ kind: 'timeout', status: undefined })
    if (thrown instanceof TypeError && !both.aborted) return err({ kind: 'unreachable', status: undefined })
    throw thrown
  }
}

/** The library line of a list that missed, by status. */
function listMissLine(miss: ArtifactsMiss): string {
  return miss.status === undefined
    ? 'Library not read — the server did not answer'
    : `Library not read — the server answered ${String(miss.status)}`
}

followPageVisibility()

/** The visit's state: how many pages show, what was new at its first list, the seen post and the follow-up. */
const visit: { pages: number; seenAt: string | null | undefined; seenSent: boolean; followedUp: boolean } = {
  pages: 0,
  seenAt: undefined,
  seenSent: false,
  followedUp: false,
}

/**
 * The page shows: a visit starts or goes on. The returned function ends it, one task later, so React's development
 * remount of the same page keeps the visit.
 */
export function enterVisit(): () => void {
  visit.pages += 1
  return () => {
    visit.pages -= 1
    setTimeout(() => {
      if (visit.pages > 0) return
      visit.seenAt = undefined
      visit.seenSent = false
      visit.followedUp = false
    }, 0)
  }
}

/** Whether the page reads the list once more after a partial one: once for each run of partial lists. */
export function takeFollowUp(partial: boolean): boolean {
  if (!partial) {
    visit.followedUp = false
    return false
  }
  if (visit.followedUp) return false
  visit.followedUp = true
  return true
}

/**
 * Posts `POST /api/artifacts/seen` once for the visit, after its first list that read the library showed. A miss is
 * reported only; the next visit posts again.
 */
export async function sendSeen(): Promise<void> {
  // Before a list read the library, the owner has seen nothing of it.
  if (visit.seenSent || visit.seenAt === undefined) return
  visit.seenSent = true
  const sent = await send((signal) => api.api.artifacts.seen.$post({ json: {} }, { init: { signal } }))
  if (!sent.ok) reportMiss('seen', sent.error)
}

/** The trip to the background whose quiet miss the list read has had (`hidesSoFar`). */
let quietTrip: number | undefined

/** A list read that started at `mark` and got no answer is the close of a trip to the background (lib/pageResume.ts). */
function quietMiss(miss: ArtifactsMiss, mark: ResumeMark): boolean {
  if (miss.status !== undefined) return false
  if (isHidden()) {
    quietTrip = hidesSoFar()
    return true
  }
  if (!fromBackground(mark) || quietTrip === hidesSoFar()) return false
  quietTrip = hidesSoFar()
  return true
}

const readList = (signal: AbortSignal | undefined) =>
  send((init) => api.api.artifacts.$get(undefined, { init: { signal: init } }), signal)

export type LiveArtifactsDeps = {
  /** The router's signal for this load: it aborts when the owner leaves the page or the load starts again. */
  readonly signal?: AbortSignal | undefined
  readonly now?: () => Date
}

type ArtifactsState = ScreenState<ArtifactsData, ArtifactsUi>

/** `state` with the server's library in place of the sample one, or with none and the miss's line. */
export async function withLiveArtifacts(
  state: ArtifactsState,
  { signal, now = () => new Date() }: LiveArtifactsDeps = {},
): Promise<ArtifactsState> {
  let mark = resumeMark()
  let answer = await readList(signal)
  while (!answer.ok && quietMiss(answer.error, mark)) {
    await whenVisible(signal ?? new AbortController().signal)
    signal?.throwIfAborted()
    mark = resumeMark()
    answer = await readList(signal)
  }
  if (!answer.ok) {
    reportMiss('list', answer.error)
    const empty = ArtifactsResponse.parse({ checkedAt: null, lastSeenAt: null, partial: false, artifacts: [] })
    const data = liveLibrary(state.data, empty, { seenAt: null, now: now() })
    return { ...state, data: { ...data, found: listMissLine(answer.error), live: { partial: false } } }
  }
  const response = ArtifactsResponse.parse(readJson(answer.value.body))
  if (visit.seenAt === undefined) visit.seenAt = response.lastSeenAt
  return { ...state, data: liveLibrary(state.data, response, { seenAt: visit.seenAt, now: now() }) }
}

/** A write's miss line: what did not happen, then why, by status. */
const missLine = (lead: string, miss: ArtifactsMiss) =>
  miss.status === undefined
    ? `${lead} — the server did not answer`
    : `${lead} — the server answered ${String(miss.status)}`

/** Adds a link (`POST /api/artifacts`): the artifact's ID and whether it is new (201) or one the library had (200). */
export async function addArtifact(input: AddLinkInput): Promise<Result<{ id: string; added: boolean }, string>> {
  const sent = await send((signal) =>
    api.api.artifacts.$post(
      {
        json: {
          link: input.link,
          source: input.source,
          title: input.title,
          ...(input.project === null ? {} : { project: input.project }),
        },
      },
      { init: { signal } },
    ),
  )
  if (sent.ok) {
    const { artifact } = AddArtifactResponse.parse(readJson(sent.value.body))
    return ok({ id: artifact.id, added: sent.value.status === 201 })
  }
  if (sent.error.status === 400) return err('Not added — check the link and the title')
  reportMiss('add', sent.error)
  return err(missLine('Not added', sent.error))
}

/** Files the artifact `id` in `project`, or in none for `noProject` (`PATCH /api/artifacts/:artifact`). */
export async function fileArtifact(id: string, project: string): Promise<Result<void, string>> {
  const sent = await send((signal) =>
    api.api.artifacts[':artifact'].$patch(
      { param: { artifact: id }, json: { project: project === noProject ? null : project } },
      { init: { signal } },
    ),
  )
  if (sent.ok) return ok(undefined)
  if (sent.error.status === 404) return err('Not filed — it is no longer in the library')
  reportMiss('file', sent.error)
  return err(missLine('Not filed', sent.error))
}

/** Removes the artifact `id` from the library (`DELETE /api/artifacts/:artifact`); a 404 is gone already. */
export async function removeArtifact(id: string): Promise<Result<void, string>> {
  const sent = await send((signal) =>
    api.api.artifacts[':artifact'].$delete({ param: { artifact: id } }, { init: { signal } }),
  )
  if (sent.ok || sent.error.status === 404) return ok(undefined)
  reportMiss('remove', sent.error)
  return err(missLine('Not removed', sent.error))
}
