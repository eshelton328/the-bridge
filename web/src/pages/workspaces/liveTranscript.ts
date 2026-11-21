// The live transcript of one chat (slice 3b): `GET /api/chats/:chat/transcript`
// and its event stream `GET /api/chats/:chat/transcript/events`, read only
// while the chat's pane shows. ChatPane starts the read when it mounts, through
// the page (`watchTranscript`), and stops it when it unmounts; one stream for
// each chat however many panes show it.
//
// Order, as the contract says (contract/src/transcripts.ts): open the stream,
// then read the transcript, then apply each `transcript.changed` event by
// entry ID: a known ID replaces its entry in place, a new ID goes at the end.
// Events that come before the read's answer wait for it. After the stream
// drops, the page connects again after the server's retry time (5 s) and
// reads the transcript again.
//
// Misses (d-115). A stream that answers 404 waits for the read, which decides
// whether the chat exists: both 404s are ErrorBody `not-found`, and the
// message is not contract. A read 404 is an unknown chat: the quiet line. A
// read 200 is a server with no stream route yet (before backend 3b-3), or a
// chat that went away between the two answers, which the live list drops
// soon: the page shows the read's entries with no line and no report, and
// does not connect again; it reads again when the chat opens again. Any other
// miss shows a
// quiet line in the pane with Retry: a read that missed ("Transcript not live
// — <kind>"), a stream that dropped or answered 5xx ("connecting again") or
// that the server refused ("stopped"). A stream that ends with an `error`
// event of kind `not-found` is a chat that left the list (after /clear, or
// when its pane closed; backend #313): the page ends it quietly, with no
// line, no report, no read and no connecting again. Only the event's kind
// decides, never its message. report() gets one TranscriptMissError
// for each outage of each chat, with the miss's kind, its HTTP status and the
// chat ID only: never transcript text, a tool target or the server's message.
import {
  ChatId,
  ErrorBody,
  maxTranscriptEntries,
  TranscriptChangedEvent,
  type TranscriptEntry,
  TranscriptResponse,
} from '@bridge/contract'
import type { Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { type Frame, frames, type LiveMiss, liveReadTimeoutMs, readChecked, readJson } from './liveWorkspaces.ts'
import type { AgentKind, ChatEntry, WorkspacesData } from './types.ts'

/** The pane's quiet lines, picked by the chat that built slice 3b's page part (d-101); the PR records them. */
export const transcriptText = {
  /** Over the entries, when the server has older entries than the last 500 it sends. */
  earlier: 'Earlier entries not live yet',
  /** Under an entry whose text the server cut at 65,536 characters. */
  cut: 'Cut — full text not live yet',
  /** In place of the entries when the read transcript has none. */
  empty: 'No messages yet',
  /** Before the names of the files sent with a prompt, until the page shows them as chips. */
  files: 'Files:',
  /** Under the entries while the stream is down and the page connects again. */
  dropped: 'Transcript updates lost — connecting again',
} as const

/** What a read or a stream missed, for the pane's line and report(): never text from the server. */
type TranscriptMiss = {
  readonly part: 'read' | 'stream'
  /** A LiveMiss kind; `bad-reply` for a read the contract refuses; `ended` for a stream that ended; `bad-event`. */
  readonly kind: LiveMiss['kind'] | 'bad-reply' | 'ended' | 'bad-event'
  readonly status?: number | undefined
  /** The ErrorBody kind of an error answer or of the stream's `error` event, when it has one. */
  readonly errorKind?: string | undefined
}

/** The line of a read that missed: "Transcript not live — <kind>", with the status of an error answer. */
const readLine = (miss: TranscriptMiss) =>
  `Transcript not live — ${miss.kind}${miss.status === undefined ? '' : ` ${String(miss.status)}`}`

/** A transcript miss for report(): its part, kind, status and chat ID in the message, and nothing else. */
class TranscriptMissError extends Error {
  readonly chat: string
  readonly miss: TranscriptMiss['kind']

  constructor(chat: string, miss: TranscriptMiss) {
    const status = miss.status === undefined ? '' : ` ${String(miss.status)}`
    const errorKind = miss.errorKind === undefined ? '' : ` ${miss.errorKind}`
    super(`A chat transcript ${miss.part} missed: ${miss.kind}${status}${errorKind} (chat ${chat})`)
    this.name = 'TranscriptMissError'
    this.chat = chat
    this.miss = miss.kind
  }
}

/**
 * `current` with each of `changed` applied by ID: an entry with a known ID takes its place, a new one goes at the end,
 * in the order of `changed`. Only the last `maxTranscriptEntries` stay; `dropped` says how many older ones went.
 */
export function mergeEntries(
  current: readonly TranscriptEntry[],
  changed: readonly TranscriptEntry[],
): { entries: TranscriptEntry[]; dropped: number } {
  const next = [...current]
  const at = new Map(next.map((entry, i) => [entry.id, i]))
  for (const entry of changed) {
    const i = at.get(entry.id)
    if (i === undefined) {
      at.set(entry.id, next.length)
      next.push(entry)
    } else next[i] = entry
  }
  const dropped = Math.max(0, next.length - maxTranscriptEntries)
  return { entries: dropped === 0 ? next : next.slice(dropped), dropped }
}

/** What the pane shows of one chat's transcript. */
export type TranscriptView = {
  /** A read has answered, so `entries` is the transcript, not a start with nothing read yet. */
  readonly loaded: boolean
  readonly entries: readonly TranscriptEntry[]
  /** The server has older entries than these. */
  readonly earlier: boolean
  /** The quiet line under the entries, with Retry; none when not set. */
  readonly problem: string | undefined
}

const emptyView: TranscriptView = { loaded: false, entries: [], earlier: false, problem: undefined }

/** Each watched chat's view, by chat ID; a new map on each change, for useSyncExternalStore. */
let views: ReadonlyMap<string, TranscriptView> = new Map()
const listeners = new Set<() => void>()

/** The views of the watched chats, by chat ID. */
export const transcriptViews = (): ReadonlyMap<string, TranscriptView> => views

/** Calls `listener` after each change of a view; the result unsubscribes. */
export function subscribeTranscripts(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setView(chat: string, view: TranscriptView | undefined): void {
  const next = new Map(views)
  if (view === undefined) next.delete(chat)
  else next.set(chat, view)
  views = next
  for (const listener of listeners) listener()
}

/**
 * The chats with a miss that report() has had, until a read succeeds again or the chat no longer shows: one report
 * for each outage of a shown chat.
 */
const outages = new Set<string>()

function noteOutage(chat: string, miss: TranscriptMiss): void {
  if (outages.has(chat)) return
  outages.add(chat)
  report(new TranscriptMissError(chat, miss), 'live')
}

export type TranscriptDeps = {
  /** How long to wait before connecting again after a drop, until the stream's `retry` says otherwise. */
  readonly retryMs?: number
  /** How long the stream may take to answer (its headers) before it counts as a timeout; 8 s by default. */
  readonly openMs?: number
}

// The RPC client has no stream route until backend 3b-3 lands, so the stream opens with fetch, the chat ID
// URL-encoded as the RPC client encodes it for the read.
const openStream = (chat: ChatId, signal: AbortSignal) =>
  fetch(`/api/chats/${encodeURIComponent(chat)}/transcript/events`, {
    signal,
    headers: { Accept: 'text/event-stream' },
  })

const readTranscript = (chat: ChatId, signal: AbortSignal) =>
  readChecked(
    (init) =>
      api.api.chats[':chat'].transcript.$get({ param: { chat: encodeURIComponent(chat) } }, { init: { signal: init } }),
    (body) => TranscriptResponse.parse(body),
    AbortSignal.any([signal, AbortSignal.timeout(liveReadTimeoutMs)]),
  )

/**
 * The part of an event that came before the read answered which still applies to the read's entries. An event names
 * no position, so an ID the read does not hold is new only when the read cut nothing (`earlier` false). When it cut
 * older entries, such an ID may be one of them, and adding it would put an old entry last and push a newer one out:
 * it is left out, and the next read (a reconnect or a reopen) shows it. A known ID always applies, in its place.
 */
export function bufferedAfterRead(
  read: { readonly entries: readonly TranscriptEntry[]; readonly earlier: boolean },
  entries: readonly TranscriptEntry[],
): readonly TranscriptEntry[] {
  if (!read.earlier) return entries
  const held = new Set(read.entries.map((e) => e.id))
  return entries.filter((e) => held.has(e.id))
}

/** One watched chat: how many panes show it, Retry and stop. */
type Session = { watchers: number; readonly retry: () => void; readonly stop: () => void }

const sessions = new Map<string, Session>()

/** What a connection asks next: connect again after the retry time, or wait for Retry. */
type Outcome = 'again' | 'wait'

function startSession(chat: ChatId, deps: TranscriptDeps): Session {
  let retryMs = deps.retryMs ?? 5000
  const abort = new AbortController()
  const closed = () => abort.signal.aborted
  let wake: (() => void) | undefined
  const update = (change: (view: TranscriptView) => TranscriptView) => {
    if (!closed()) setView(chat, change(views.get(chat) ?? emptyView))
  }
  const fail = (line: string, miss: TranscriptMiss) => {
    if (closed()) return
    update((view) => ({ ...view, problem: line }))
    noteOutage(chat, miss)
  }
  const apply = (entries: readonly TranscriptEntry[]) => {
    update((view) => {
      const merged = mergeEntries(view.entries, entries)
      return { ...view, entries: merged.entries, earlier: view.earlier || merged.dropped > 0 }
    })
  }

  /** Reads the transcript and shows it; false when the read missed (the line shows) or `signal` ended it. */
  const load = async (signal: AbortSignal): Promise<boolean> => {
    let answer: Result<TranscriptResponse, LiveMiss>
    try {
      answer = await readTranscript(chat, signal)
    } catch (thrown) {
      if (signal.aborted) return false
      // A reply that is not JSON or that the contract refuses: the line and the report name its kind, not its text.
      if (thrown instanceof Error) {
        const miss = { part: 'read', kind: 'bad-reply' } as const
        fail(readLine(miss), miss)
        return false
      }
      throw thrown
    }
    if (signal.aborted) return false
    if (!answer.ok) {
      const miss: TranscriptMiss = {
        part: 'read',
        kind: answer.error.kind,
        status: 'status' in answer.error ? answer.error.status : undefined,
        errorKind: answer.error.kind === 'status' ? answer.error.errorKind : undefined,
      }
      fail(readLine(miss), miss)
      return false
    }
    if (answer.value.chat !== chat) {
      const miss = { part: 'read', kind: 'bad-reply' } as const
      fail(readLine(miss), miss)
      return false
    }
    const { entries, earlier } = answer.value
    update(() => ({ loaded: true, entries, earlier, problem: undefined }))
    outages.delete(chat)
    return true
  }

  /** One connection: the stream, the read, then the events until the stream ends. */
  const connect = async (): Promise<Outcome> => {
    const connection = new AbortController()
    const signal = AbortSignal.any([abort.signal, connection.signal])
    let res: Response
    // A stream that gives no answer at all would leave the pane blank, as the read waits for it: after `openMs` it
    // is a timeout, with the line, and it connects again. The limit ends once the answer's headers come.
    const opening = { late: false }
    const limit = setTimeout(() => {
      opening.late = true
      connection.abort()
    }, deps.openMs ?? liveReadTimeoutMs)
    try {
      res = await openStream(chat, signal)
    } catch {
      if (closed()) return 'wait'
      // fetch rejects when no answer comes in time, or when the server or the tailnet cannot be reached.
      fail(transcriptText.dropped, { part: 'stream', kind: opening.late ? 'timeout' : 'unreachable' })
      return 'again'
    } finally {
      clearTimeout(limit)
    }
    if (res.status === 404) {
      // The read decides: a 404 read shows its line (an unknown chat); a 200 read shows the transcript with no line,
      // no report and no connecting again, as the server has no stream route yet (before backend 3b-3) or the chat
      // went away between the two answers. The page reads again when the chat opens again.
      connection.abort()
      await load(abort.signal)
      return 'wait'
    }
    if (!res.ok || res.body === null) {
      connection.abort()
      const miss = { part: 'stream', kind: 'status', status: res.status } as const
      // A 5xx is the server or its proxy with no answer for now: connect again. Any other status is a refusal.
      if (res.status >= 500) {
        fail(transcriptText.dropped, miss)
        return 'again'
      }
      fail(`Transcript updates stopped — ${String(res.status)}`, miss)
      return 'wait'
    }
    let loaded = false
    // Set by `take` while the stream runs: an event the page cannot read, the kind of the server's `error` event, and
    // whether that kind says the chat left the list.
    const seen: { unreadable: boolean; serverKind: string | undefined; gone: boolean } = {
      unreadable: false,
      serverKind: undefined,
      gone: false,
    }
    const waiting: (readonly TranscriptEntry[])[] = []
    const take = (frame: Frame) => {
      if (frame.retry !== undefined) retryMs = frame.retry
      if (frame.event === 'error') {
        const body = ErrorBody.safeParse(readJson(frame.data))
        seen.serverKind = body.success ? body.data.error.kind : undefined
        // The chat left the list: end this connection, and the read that may still run, with nothing more.
        if (seen.serverKind === 'not-found') {
          seen.gone = true
          connection.abort()
        }
        return
      }
      if (frame.event !== 'transcript.changed') return
      const parsed = TranscriptChangedEvent.safeParse(readJson(frame.data))
      // An event the page cannot read: end this connection, and the next one reads the transcript again.
      if (!parsed.success || parsed.data.data.chat !== chat) {
        seen.unreadable = true
        connection.abort()
        return
      }
      if (loaded) apply(parsed.data.data.entries)
      else waiting.push(parsed.data.data.entries)
    }
    const body = res.body
    const streamed = (async () => {
      try {
        for await (const frame of frames(body)) take(frame)
        return 'ended' as const
      } catch {
        // The connection dropped or this page closed it: the caller says which, and shows the drop.
        return 'dropped' as const
      }
    })()
    const read = await load(signal)
    if (read) {
      loaded = true
      const shown = views.get(chat) ?? emptyView
      for (const entries of waiting) apply(bufferedAfterRead(shown, entries))
    } else connection.abort()
    await streamed
    if (closed()) return 'wait'
    if (seen.gone) {
      // No line, no report and no connecting again: a line left by an earlier drop goes too, as nothing reconnects.
      update((view) => ({ ...view, problem: undefined }))
      outages.delete(chat)
      return 'wait'
    }
    if (seen.unreadable) {
      fail(transcriptText.dropped, { part: 'stream', kind: 'bad-event' })
      return 'again'
    }
    // A read that missed shows its line; Retry starts again.
    if (!read) return 'wait'
    fail(transcriptText.dropped, { part: 'stream', kind: 'ended', errorKind: seen.serverKind })
    return 'again'
  }

  /** Waits `ms`, or with none until Retry; Retry and a stop end the wait at once. */
  const pause = (ms: number | undefined) =>
    new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        abort.signal.removeEventListener('abort', done)
        wake = undefined
        resolve()
      }
      const timer = ms === undefined ? undefined : setTimeout(done, ms)
      wake = done
      abort.signal.addEventListener('abort', done, { once: true })
    })

  const run = async () => {
    while (!closed()) {
      const outcome = await connect()
      if (closed()) return
      await pause(outcome === 'again' ? retryMs : undefined)
    }
  }
  void run()
  return {
    watchers: 0,
    retry: () => {
      update((view) => ({ ...view, problem: undefined }))
      wake?.()
    },
    stop: () => {
      abort.abort()
    },
  }
}

/**
 * Reads `chat`'s transcript into its view (`transcriptViews`) until the result is called: one session for each chat,
 * however many panes watch it. The last stop closes the stream and drops the view, so the chat opened again reads
 * the transcript again.
 */
export function watchTranscript(chat: string, deps: TranscriptDeps = {}): () => void {
  let session = sessions.get(chat)
  if (session === undefined) {
    session = startSession(ChatId.parse(chat), deps)
    sessions.set(chat, session)
  }
  const watched = session
  watched.watchers += 1
  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    watched.watchers -= 1
    if (watched.watchers > 0) return
    watched.stop()
    if (sessions.get(chat) === watched) sessions.delete(chat)
    setView(chat, undefined)
    // The chat no longer shows: a miss when it opens again is reported again.
    outages.delete(chat)
  }
}

/** Connects and reads `chat`'s transcript again now: the Retry of its line. */
export function retryTranscript(chat: string): void {
  sessions.get(chat)?.retry()
}

const agentNames: Record<AgentKind, string> = { claude: 'Claude', codex: 'Codex', shell: 'Shell' }

/** One transcript entry as the page draws it, in a chat of `kind`: the agent's name and Copy on a reply. */
export function chatEntryOf(entry: TranscriptEntry, kind: AgentKind): ChatEntry {
  const cut = 'cut' in entry && entry.cut ? { cut: transcriptText.cut } : {}
  switch (entry.type) {
    case 'user': {
      // Each name as inline code, so Markdown in a file name stays text.
      const files = entry.files?.map((name) => `\`${name.replaceAll('`', '')}\``).join(', ')
      const line = files === undefined ? '' : `${transcriptText.files} ${files}`
      const text = line === '' ? entry.text : entry.text === '' ? line : `${entry.text}\n\n${line}`
      return { type: 'user', text, ...cut }
    }
    case 'assistant':
      return { type: 'assistant', kind, name: agentNames[kind], text: entry.text, copy: 'Copy', ...cut }
    case 'tool':
      return { type: 'tool', name: entry.name, target: entry.target, running: entry.running }
  }
}

/**
 * `data` with each watched live chat's transcript in its pane: its entries, the earlier line, the empty line once a
 * read found none, and the problem line.
 */
export function withTranscripts(data: WorkspacesData, shown: ReadonlyMap<string, TranscriptView>): WorkspacesData {
  if (shown.size === 0) return data
  return {
    ...data,
    panes: data.panes.map((pane) => {
      if (pane.type !== 'chat' || pane.liveChat === undefined) return pane
      const view = shown.get(pane.liveChat)
      if (view === undefined) return pane
      return {
        ...pane,
        entries: view.entries.map((entry) => chatEntryOf(entry, pane.head.kind)),
        ...(view.earlier ? { earlier: transcriptText.earlier } : {}),
        ...(view.loaded && view.entries.length === 0 && view.problem === undefined
          ? { empty: transcriptText.empty }
          : {}),
        ...(view.problem === undefined ? {} : { problem: view.problem }),
      }
    }),
  }
}
