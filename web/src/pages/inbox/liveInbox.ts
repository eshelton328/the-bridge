// The live source of the Inbox: its home in development and `?source=live`
// (as the Workspaces and Artifacts homes, d-117). The loader reads the items
// from the-bridge server (`GET /api/inbox`) through the typed RPC client and
// maps them onto the home (liveList.ts); the tab badge is the server's
// `counts.needsYou`.
//
// While the page shows, the app's one event stream (`GET /api/events`,
// app/InboxFeedProvider.tsx; lib/inboxClient.ts `watchInboxChanges`) tells
// the page to load again on each `inbox.changed`, and each time the stream
// opens, so an event lost while it was closed does no harm. A burst of events
// gives one load (`settleMs`). No read runs on a timer. The page's load gives
// the app its badge count, so no second list read runs while it shows.
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
//
// Review R43b (as the Workspaces list, #428): a list read with no answer from
// the server (none, a timeout, or a 5xx with no error body: the Vite proxy for
// a server that is down, as in a restart) after the page showed a list keeps
// that list for `reconnectGraceMs`, with no line and no report. The page keeps
// it here (`lastShown`) while it watches the list, not in the router's cache,
// which drops a page no one shows after a while. When the grace passes the
// page loads again, and a miss then shows its line, with one report for the
// outage. A read that answers ends the grace. A 4xx, an error body, or a
// first read with nothing shown yet shows the line at once.
import { InboxDetailResponse, InboxResponse } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { reconnectGraceMs } from '../../lib/eventFrames.ts'
import {
  type Answer,
  type InboxMiss,
  InboxMissError,
  type InboxStep,
  missLine,
  readInboxList,
  readJson,
  readQuietly,
  send,
} from '../../lib/inboxClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { liveList, snoozeAt } from './liveList.ts'
import type { InboxData, InboxPutAway, InboxSnoozeMenu, InboxUi, LiveOpen } from './types.ts'

/** Reports a miss that the server answered; one with no answer is the line's alone. */
function reportMiss(step: InboxStep, miss: InboxMiss): void {
  if (miss.status !== undefined) report(new InboxMissError(step, miss), 'live')
}

/** The live Inbox with no items: a miss shows it with its line, and the pending screen loads on it. */
export const emptyInbox = InboxResponse.parse({ items: [], counts: { needsYou: 0, total: 0 } })

export type LiveInboxDeps = {
  /** The router's signal for this load: it aborts when the owner leaves the page or the load starts again. */
  readonly signal?: AbortSignal | undefined
  readonly now?: () => Date
}

type InboxState = ScreenState<InboxData, InboxUi>

/** How many shown Inbox pages watch the live list, and how one loads it again (the router's invalidate). */
let watching = 0
let reload: (() => void) | undefined
/** The list the page last showed while it watched; a read with no answer keeps it within the grace. */
let lastShown: InboxResponse | undefined
/** The grace of a list read with no answer (R43b), until a read answers; `over` once it passed. */
let listGrace: { readonly timer: ReturnType<typeof setTimeout>; over: boolean; reported: boolean } | undefined

const endListGrace = () => {
  clearTimeout(listGrace?.timer)
  listGrace = undefined
}

/** A miss with no answer from the server: none, a timeout, or a 5xx with no error body. */
const noAnswer = (miss: InboxMiss) => miss.status === undefined || (miss.kind === 'status' && miss.status >= 500)

/**
 * The live Inbox page watches its list while it shows: `load` loads it again when a grace passes. The result ends the
 * watch; when no page watches, the last list and any grace are dropped, so a miss on the next visit shows at once.
 */
export function watchLiveInbox(load: () => void): () => void {
  watching += 1
  reload = load
  let done = false
  return () => {
    if (done) return
    done = true
    watching -= 1
    if (reload === load) reload = undefined
    if (watching === 0) {
      lastShown = undefined
      endListGrace()
    }
  }
}

/** Whether a list read's `miss` keeps the last list: one with no answer, within the grace its first miss starts. */
function quietListMiss(miss: InboxMiss): boolean {
  if (lastShown === undefined || !noAnswer(miss)) return false
  if (listGrace === undefined) {
    const started = {
      timer: setTimeout(() => {
        started.over = true
        reload?.()
      }, reconnectGraceMs),
      over: false,
      reported: false,
    }
    listGrace = started
  }
  return !listGrace.over
}

/** `state` with the server's items in place of the sample ones, or with none and the miss's line. */
export async function withLiveInbox(
  state: InboxState,
  { signal, now = () => new Date() }: LiveInboxDeps = {},
): Promise<InboxState> {
  const answer = await readInboxList('list', signal)
  if (!answer.ok) {
    const kept = lastShown
    if (kept !== undefined && quietListMiss(answer.error)) return { ...state, ...liveList(state, kept, { now: now() }) }
    // Past the grace, one report for the outage; any other miss is reported each time, as before.
    const outage = noAnswer(answer.error) ? listGrace : undefined
    if (outage?.reported !== true) reportMiss('list', answer.error)
    if (outage !== undefined) outage.reported = true
    return { ...state, ...liveList(state, emptyInbox, { now: now(), line: missLine('Inbox not read', answer.error) }) }
  }
  endListGrace()
  const response = answer.value
  if (watching > 0) lastShown = response
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
    // The menu's choice, else the choice that shows this time.
    const value = to.value ?? menu.times.find((t) => t.time === to.until)?.value
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
