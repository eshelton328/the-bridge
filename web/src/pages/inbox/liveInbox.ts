// The live source of the Inbox: its home in development and `?source=live`
// (as the Workspaces and Artifacts homes, d-117). The loader reads the items
// from the-bridge server (`GET /api/inbox`) through the typed RPC client and
// maps them onto the home (liveList.ts); the tab badge is the server's
// `counts.needsYou`.
//
// While the page shows, `watchInboxChanges` reads the event stream
// (`GET /api/events`) and tells the page to load again on each
// `inbox.changed`, and each time the stream opens, so an event lost while it
// was closed does no harm. A burst of events gives one load (`settleMs`). No
// read runs on a timer.
//
// A list that misses shows no items, never the sample ones, and one short
// line under the list tools by status ("Inbox not read — the server answered
// 500"). report() gets only a miss with an answer from the server, by its
// step, kind and status, never a title, a body or the server's message. A
// list read with no answer at all while the page is hidden, after it hid
// during the read or within 5 s after it showed again is iOS closing it in
// the background (lib/pageResume.ts): no line and no report, and the list is
// read again once the page shows; one such miss for each trip. A reply the
// contract refuses throws, for RouteError.
import { ErrorBody, type ErrorKind, InboxDetailResponse, InboxResponse } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { frames } from '../../lib/eventFrames.ts'
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
import { liveList, snoozeAt } from './liveList.ts'
import type { InboxData, InboxPutAway, InboxSnoozeMenu, InboxUi, LiveOpen } from './types.ts'

/** How long a read or a write waits for the server, in ms, as the Workspaces reads do (d-101). */
const inboxTimeoutMs = 8000

/** A request that missed: its error kind (or `unreachable`, `timeout`, `status`) and the HTTP status, if one came. */
type InboxMiss = {
  readonly kind: ErrorKind['kind'] | 'unreachable' | 'timeout' | 'status'
  readonly status: number | undefined
}

/** A step of the page that reads or writes the server. */
type InboxStep = 'list' | 'detail' | 'snooze' | 'done' | 'dismiss'

/** A miss for report(): a stable name and, in its message, only the step, the kind and the status. */
class InboxMissError extends Error {
  readonly miss: string

  constructor(step: InboxStep, miss: InboxMiss) {
    const what = `${step} ${miss.kind}${miss.status === undefined ? '' : ` ${String(miss.status)}`}`
    super(`An inbox request missed: ${what}`)
    this.name = 'InboxMissError'
    this.miss = what
  }
}

/** Reports a miss that the server answered; one with no answer is the line's alone. */
function reportMiss(step: InboxStep, miss: InboxMiss): void {
  if (miss.status !== undefined) report(new InboxMissError(step, miss), 'live')
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
 * Sends one request through the RPC client (`call`) with `inboxTimeoutMs`, and gives the answer's body text on a 2xx.
 * A failed request (`TypeError`) is `unreachable`, the timeout `timeout`, and an error status the error body's kind, or
 * `status` when it has none. Any other abort, such as the owner leaving the page, throws.
 */
async function send(
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
const missLine = (lead: string, miss: InboxMiss): string =>
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
async function readQuietly<T>(
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

const emptyInbox = InboxResponse.parse({ items: [], counts: { needsYou: 0, total: 0 } })

export type LiveInboxDeps = {
  /** The router's signal for this load: it aborts when the owner leaves the page or the load starts again. */
  readonly signal?: AbortSignal | undefined
  readonly now?: () => Date
}

type InboxState = ScreenState<InboxData, InboxUi>

/** `state` with the server's items in place of the sample ones, or with none and the miss's line. */
export async function withLiveInbox(
  state: InboxState,
  { signal, now = () => new Date() }: LiveInboxDeps = {},
): Promise<InboxState> {
  const answer = await readQuietly(
    'list',
    () => send((init) => api.api.inbox.$get(undefined, { init: { signal: init } }), signal),
    signal,
  )
  if (!answer.ok) {
    reportMiss('list', answer.error)
    return { ...state, ...liveList(state, emptyInbox, { now: now(), line: missLine('Inbox not read', answer.error) }) }
  }
  const response = InboxResponse.parse(readJson(answer.value.body))
  return { ...state, ...liveList(state, response, { now: now() }) }
}

/**
 * Reads one item's detail (`GET /api/inbox/:item`) for its open row: a chat item's chat, or a brain item's record.
 * A miss is one line ("Not read — the server answered 500"; a 404 "This item is no longer in the Inbox"); a read with
 * no answer around a trip to the background is quiet and goes again once the page shows.
 */
export async function readItem(id: string, signal: AbortSignal): Promise<Omit<LiveOpen, 'canAct' | 'source'>> {
  const answer = await readQuietly(
    'detail',
    () => send((init) => api.api.inbox[':item'].$get({ param: { item: id } }, { init: { signal: init } }), signal),
    signal,
  )
  if (!answer.ok) {
    if (answer.error.status === 404) return { read: 'missed', line: 'This item is no longer in the Inbox' }
    reportMiss('detail', answer.error)
    return { read: 'missed', line: missLine('Not read', answer.error) }
  }
  const { detail } = InboxDetailResponse.parse(readJson(answer.value.body))
  return detail.source === 'chat'
    ? {
        read: 'read',
        line: null,
        chat: detail.chat === null ? null : { title: detail.chat.title, model: detail.chat.model },
      }
    : { read: 'read', line: null, body: detail.body }
}

const markLead = { snooze: 'Not snoozed', done: 'Not marked done', dismiss: 'Not dismissed' } as const

/**
 * Sends a snooze, a done or a dismiss of the item `id` (`POST /api/inbox/:item/snooze | done | dismiss`). A snooze's
 * `until` is the Snooze menu's time; it ends at that choice's time from now (`snoozeAt`). It answers nothing on a 204,
 * else the miss's line: a 409 is a brain item, read-only here ("Not snoozed — it is read-only here"), a 404 an item
 * gone already. report() gets an answered miss other than those two.
 */
export async function markItem(
  id: string,
  to: Parameters<InboxPutAway>[1],
  menu: InboxSnoozeMenu,
  now = new Date(),
): Promise<Result<void, string>> {
  const step = 'until' in to ? 'snooze' : to.result === 'done' ? 'done' : 'dismiss'
  const param = { param: { item: id } }
  const item = api.api.inbox[':item']
  let call: (signal: AbortSignal) => Promise<Answer>
  if ('until' in to) {
    const value = menu.times.find((t) => t.time === to.until)?.value
    const at = value === undefined ? undefined : snoozeAt(value, now)
    if (at === undefined) return err(`${markLead.snooze} — pick a time from the menu`)
    call = (signal) => item.snooze.$post({ ...param, json: { until: at.toISOString() } }, { init: { signal } })
  } else if (step === 'done') call = (signal) => item.done.$post({ ...param, json: {} }, { init: { signal } })
  else call = (signal) => item.dismiss.$post({ ...param, json: {} }, { init: { signal } })
  const sent = await send(call)
  if (sent.ok) return ok(undefined)
  if (sent.error.status === 409) return err(`${markLead[step]} — it is read-only here`)
  if (sent.error.status === 404) return err(`${markLead[step]} — it is no longer in the Inbox`)
  reportMiss(step, sent.error)
  return err(missLine(markLead[step], sent.error))
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
