// The Inbox's client of the-bridge server, shared by the Inbox page
// (pages/inbox/liveInbox.ts) and the app's live Inbox badge
// (app/InboxFeedProvider.tsx): one request with its timeout and miss, a read
// that is quiet around a trip to the background (lib/pageResume.ts), the
// Inbox list (`GET /api/inbox`) and the watcher of `inbox.changed` on
// `GET /api/events`. It reports nothing; its callers report a miss by its
// step, kind and status only (`InboxMissError`).
import { ErrorBody, type ErrorKind, InboxResponse } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { api } from './api.ts'
import { frames } from './eventFrames.ts'
import {
  followPageVisibility,
  fromBackground,
  hidesSoFar,
  isHidden,
  type ResumeMark,
  resumeMark,
  whenVisible,
} from './pageResume.ts'

/** How long a read or a write waits for the server, in ms, as the Workspaces reads do (d-101). */
const inboxTimeoutMs = 8000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
export type InboxMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

/** A step that reads or writes the server: the Inbox page's, or the app badge's list read. */
export type InboxStep = 'list' | 'badge' | 'detail' | 'snooze' | 'done' | 'dismiss'

/** A miss for report(): a stable name and, in its message, only the step, the kind and the status. */
export class InboxMissError extends Error {
  readonly miss: string

  constructor(step: InboxStep, miss: InboxMiss) {
    const what = `${step} ${miss.kind}${miss.status === undefined ? '' : ` ${String(miss.status)}`}`
    super(`An inbox request missed: ${what}`)
    this.name = 'InboxMissError'
    this.miss = what
  }
}

/** What a request needs of the RPC client's answer. */
export type Answer = { readonly ok: boolean; readonly status: number; text: () => Promise<string> }

export const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const timedOut = (signal: AbortSignal) =>
  signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'

/**
 * Sends one request through the RPC client (`call`) with `inboxTimeoutMs`, and gives the answer's body text on a 2xx.
 * A failed request (`TypeError`) is `unreachable`, the timeout `timeout`, and an error status the error body's kind, or
 * `status` when it has none. Any other abort, such as the owner leaving the page, throws.
 */
export async function send(
  call: (signal: AbortSignal) => Promise<Answer>,
  signal?: AbortSignal,
): Promise<Result<{ status: number; body: string }, InboxMiss>> {
  const timeout = AbortSignal.timeout(inboxTimeoutMs)
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

/** A miss's line: what did not happen, then why, by status. */
export const missLine = (lead: string, miss: InboxMiss): string =>
  miss.status === undefined
    ? `${lead} — the server did not answer`
    : `${lead} — the server answered ${String(miss.status)}`

followPageVisibility()

/** The trips to the background whose quiet miss a read has had (`hidesSoFar`), by step. */
const quietTrips = new Map<InboxStep, number>()

/** A read that started at `mark` and got no answer is the close of a trip to the background (lib/pageResume.ts). */
function quietMiss(step: InboxStep, miss: InboxMiss, mark: ResumeMark): boolean {
  if (miss.status !== undefined) return false
  if (isHidden()) {
    quietTrips.set(step, hidesSoFar())
    return true
  }
  if (!fromBackground(mark) || quietTrips.get(step) === hidesSoFar()) return false
  quietTrips.set(step, hidesSoFar())
  return true
}

/**
 * Reads with `read` and, while a read gets no answer around a trip to the background (`quietMiss`), once more when
 * the page shows.
 */
export async function readQuietly<T>(
  step: InboxStep,
  read: () => Promise<Result<T, InboxMiss>>,
  signal: AbortSignal | undefined,
): Promise<Result<T, InboxMiss>> {
  let mark = resumeMark()
  let answer = await read()
  while (!answer.ok && quietMiss(step, answer.error, mark)) {
    await whenVisible(signal ?? new AbortController().signal)
    signal?.throwIfAborted()
    mark = resumeMark()
    answer = await read()
  }
  return answer
}

/** Reads the Inbox list, quiet around a trip to the background as `step`. A reply the contract refuses throws. */
export async function readInboxList(
  step: InboxStep,
  signal: AbortSignal | undefined,
): Promise<Result<InboxResponse, InboxMiss>> {
  const answer = await readQuietly(
    step,
    () => send((init) => api.api.inbox.$get(undefined, { init: { signal: init } }), signal),
    signal,
  )
  return answer.ok ? ok(InboxResponse.parse(readJson(answer.value.body))) : answer
}

type OpenStream = (signal: AbortSignal) => Promise<Response>

const openEvents: OpenStream = (signal) =>
  api.api.events.$get(undefined, { init: { signal, headers: { Accept: 'text/event-stream' } } })

export type WatchInboxDeps = {
  /** The page loads again. */
  readonly onChange: () => void
  readonly open?: OpenStream
  /** How long a burst of events waits before it gives one `onChange`, in ms. */
  readonly settleMs?: number
}

/**
 * Reads the event stream while the page shows and gives one `onChange` for each burst of `inbox.changed` events, and
 * one each time the stream opens, as an event lost while it was closed may have changed the Inbox. When the stream ends or the network drops, it connects again after the
 * server's retry time (5 s), as EventSource does; a refused stream (a 4xx) stops it. The list read says what the
 * server answers, so the watcher shows no line of its own. The result stops it.
 */
export function watchInboxChanges({ onChange, open = openEvents, settleMs = 100 }: WatchInboxDeps): () => void {
  const abort = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let retryMs = 5000
  const changed = () => {
    timer ??= setTimeout(() => {
      timer = undefined
      onChange()
    }, settleMs)
  }
  const pause = () =>
    new Promise<void>((resolve) => {
      const wait = setTimeout(resolve, retryMs)
      abort.signal.addEventListener('abort', () => {
        clearTimeout(wait)
        resolve()
      })
    })
  // A call, so that each read sees the signal as it is now.
  const closed = () => abort.signal.aborted
  const run = async () => {
    while (!closed()) {
      try {
        const res = await open(abort.signal)
        if (res.status < 500 && (!res.ok || res.body === null)) return
        if (res.status >= 500 || res.body === null) throw new Error('no stream')
        for await (const frame of frames(res.body)) {
          if (frame.retry !== undefined) retryMs = frame.retry
          // Each open, the first too, may follow events the page missed while the stream was closed (the contract's rule).
          if (frame.event === 'open' || frame.event === 'inbox.changed') changed()
        }
      } catch {
        if (closed()) return
      }
      await pause()
    }
  }
  void run()
  return () => {
    clearTimeout(timer)
    abort.abort()
  }
}
