// The live source of the Workspaces page: its home in development (d-117)
// and `?source=live`: the workspaces and chats from the-bridge server,
// through the Hono RPC client and the query client, mapped to the page's
// view model and put on its home state. Each chat is a pane with no sample
// text: a shell's terminal and a Codex chat's transcript say they are not
// live yet until the slice that brings them lands, and a Claude chat's pane
// names its server chat ID (`liveChat`), whose transcript liveTranscript.ts
// reads while the pane shows (slice 3b). When the read misses in a way the
// page expects (the server cannot be reached, refuses this viewer or answers
// an error status), the page shows no workspaces, never the sample ones, and
// says why in a notice with Retry over every layout and in the status bar.
// A miss is a state the page shows, not an error, so it is not reported and
// the dev ErrorTray does not count it. A reply the contract refuses or a bug
// in the mapper is not a miss: it throws, the route shows RouteError and the
// root hooks report it.
// Slice 2: while the page shows, watchLiveWorkspaces keeps the query cache
// current from the server's events (`GET /api/events`, SSE) and tells the
// page to load again, at most once each `settleMs`; once the stream opens
// again after an outage, the page loads again and the notice goes.
// Slice 3a: each workspace's panes are its herdr layout's active tab
// (`GET /api/workspaces/:workspace/layout`, liveLayout.ts), read with the
// list and again on `workspaces.changed` or that workspace's
// `layout.changed`. A layout read that misses keeps the workspace's first
// `maxPanes` chats as its panes, and is not silent (d-115): the status bar
// says "Layout not live — first 4 chats" until a load reads every layout,
// and report() gets one LayoutReadMissError for each outage, not one for
// each read again. A layout the contract refuses throws, as a list it
// refuses does.
import {
  type ChatSummary,
  ErrorBody,
  type ErrorKind,
  LiveEvent,
  splitId,
  type WorkspaceId,
  WorkspaceLayout as LayoutResponse,
  type WorkspaceSummary,
  WorkspacesResponse,
} from '@bridge/contract'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { queryClient } from '../../lib/queryClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { maxPanes } from './blocks/workspaceLayout.ts'
import { layoutOfTab } from './liveLayout.ts'
import type { SidebarChat, WorkbenchPane, Workspace, WorkspaceLayout, WorkspacesData, WorkspacesUi } from './types.ts'

type WorkspacesScreenState = ScreenState<WorkspacesData, WorkspacesUi>

const modelFamilies = { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', fable: 'Fable' } as const
const isFamily = (name: string): name is keyof typeof modelFamilies => Object.hasOwn(modelFamilies, name)

/** A model ID as the app writes it: "claude-opus-5-5" is "Opus 5.5", "gpt-5.5" is "GPT-5.5". */
export function modelLabel(model: string): string {
  const claude = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model)
  const family = claude?.[1]
  if (claude && family !== undefined && isFamily(family))
    return `${modelFamilies[family]} ${claude[2] ?? ''}.${claude[3] ?? ''}`
  if (model.startsWith('gpt-')) return `GPT-${model.slice(4)}`
  return model
}

const kindLabels = { claude: 'Claude Code', codex: 'Codex', shell: 'shell' } as const

function statusOf(chat: ChatSummary): SidebarChat['status'] {
  switch (chat.status) {
    case 'working':
      // A shell, or a chat that another chat started, runs on its own.
      return chat.kind === 'shell' || chat.parent
        ? { label: 'Running', tone: 'running' }
        : { label: 'Working', tone: 'working' }
    case 'needsYou':
      return { label: 'Needs you', tone: 'needsYou' }
    case 'idle':
      return { label: 'Idle', tone: 'idle' }
    case 'done':
      return { label: 'Done', tone: 'done' }
    case 'unknown':
      return { label: 'Unknown', tone: 'idle' }
  }
}

function sidebarChat(chat: ChatSummary, titles: ReadonlyMap<string, string>): SidebarChat {
  const model =
    chat.kind === 'shell'
      ? chat.model === null
        ? 'shell'
        : `shell · ${chat.model}`
      : chat.model === null
        ? kindLabels[chat.kind]
        : modelLabel(chat.model)
  const parent = chat.parent
  return {
    id: splitId(chat.id).local,
    kind: chat.kind,
    title: chat.title,
    model,
    // A shell has no context window, so its row has no context meter, as D2 draws "brain git".
    ...(chat.kind === 'shell' || chat.contextUsed === null ? {} : { context: Math.round(chat.contextUsed * 100) }),
    status: statusOf(chat),
    ...(parent ? { level: 1 as const } : {}),
    ...(parent?.relation === 'fork'
      ? { mark: { kind: 'fork' as const, label: `Fork of ${titles.get(parent.id) ?? 'a chat'}` } }
      : {}),
  }
}

function workspaceOf(summary: WorkspaceSummary): Workspace {
  const titles = new Map(summary.chats.map((c) => [String(c.id), c.title]))
  return {
    id: splitId(summary.id).local,
    label: summary.label,
    count: summary.chats.filter((c) => !c.parent).length,
    needsYou: summary.chats.some((c) => c.status === 'needsYou'),
    chats: summary.chats.map((c) => sidebarChat(c, titles)),
  }
}

/**
 * The mapper: the server's workspaces as the page's tabs and sidebar chats. An ID keeps its local part only, as
 * slice 1 has one machine. A tab counts the chats no other chat started.
 */
export function toWorkspaces(response: WorkspacesResponse): Workspace[] {
  return response.workspaces.map(workspaceOf)
}

/**
 * What a live shell's terminal, a live Codex chat's transcript and a live Codex chat's composer show until the slice
 * that brings them lands (d-117). The server reads only a Claude chat's transcript (slice 3b), and takes a prompt and a
 * stop only for a Claude chat (W1; Codex in W8).
 */
const notLiveText = {
  transcript: 'Transcript not live yet',
  terminal: 'Terminal not live yet',
  sending: 'Sending not live yet',
} as const

/**
 * A pane for each live chat, with its header from the sidebar row and no sample text: a shell's terminal and a Codex
 * chat's transcript say they are not live yet, and a Codex chat's composer is disabled and says sending is not live
 * yet. A Claude chat's pane has no entries and names its server chat ID, `<machine>/<local>` (`liveChat`), so the page
 * reads its transcript while the pane shows (liveTranscript.ts) and sends its prompts and stops to it (liveSend.ts);
 * its composer shows Stop while the chat works. A Codex chat's pane names none, so the page reads nothing.
 */
export function livePanes(workspaces: readonly Workspace[], machine: string): WorkbenchPane[] {
  return workspaces.flatMap((w) =>
    (w.chats ?? []).map((chat): WorkbenchPane => {
      const head = {
        kind: chat.kind,
        title: chat.title,
        model: chat.model,
        ...(chat.context === undefined ? {} : { context: chat.context }),
        status: chat.status,
      }
      if (chat.kind === 'shell')
        return { type: 'shell', id: chat.id, head, lines: [], prompt: '', notLive: notLiveText.terminal }
      const claude = chat.kind === 'claude'
      return {
        type: 'chat',
        id: chat.id,
        head,
        entries: [],
        composer: {
          placeholder: claude ? 'Message, or / for a skill' : 'Reply to Codex',
          text: '',
          attachments: [],
          // The server's `working` status: "Working", or "Running" for a chat another chat started (statusOf).
          running: claude && (chat.status.tone === 'working' || chat.status.tone === 'running'),
          ...(claude ? {} : { notLive: notLiveText.sending }),
        },
        ...(claude ? { liveChat: `${machine}/${chat.id}` } : { notLive: notLiveText.transcript }),
      }
    }),
  )
}

/** The status bar's summary of `workspace` and its layout's panes, as `shownView` counts them; none with no workspace. */
const summaryOf = (workspace: Workspace | undefined, layouts: Record<string, { panes: string[] }>) => {
  if (workspace === undefined) return undefined
  const count = layouts[workspace.id]?.panes.length ?? 0
  return `${workspace.label} · ${String(count)} ${count === 1 ? 'pane' : 'panes'}`
}

/** The first chat of `ids` that is not a shell, else the first: the pane a workspace's layout focuses. */
const focusOf = (ids: readonly string[], panes: readonly WorkbenchPane[]) =>
  ids.find((id) => panes.find((p) => p.id === id)?.type === 'chat') ?? ids[0]

/**
 * `state` with only what the live source gives: `workspaces`, a pane for each of their chats, and each workspace's
 * own layout, so a tab shows only its own chats: its herdr layout from `herdr` by workspace ID, else its first
 * `maxPanes` chats with its first chat that is not a shell focused; none of the home's sample parts (side chat,
 * subagents, folders, a workspace's last chat, the toast, the status bar's alert). With no workspaces (an empty live
 * list or a missed read) no workspace is shown, never one of the sample's (P-3).
 */
function liveOnly(
  state: WorkspacesScreenState,
  workspaces: Workspace[],
  machine = '',
  herdr: ReadonlyMap<string, WorkspaceLayout> = new Map(),
): WorkspacesScreenState {
  const panes = livePanes(workspaces, machine)
  const data = state.data
  const layouts = Object.fromEntries(
    workspaces.map((w): [string, WorkspaceLayout] => {
      const read = herdr.get(w.id)
      if (read !== undefined) return [w.id, read]
      const ids = (w.chats ?? []).map((c) => c.id).slice(0, maxPanes)
      const focusedPane = focusOf(ids, panes)
      return [w.id, focusedPane === undefined ? { panes: ids } : { panes: ids, focusedPane }]
    }),
  )
  const current = workspaces[0]?.id ?? null
  const focused = current === null ? undefined : layouts[current]?.focusedPane
  return {
    ...state,
    data: {
      ...data,
      workspaces,
      current,
      panes,
      sideChat: undefined,
      subagents: undefined,
      folders: undefined,
      folderPicker: undefined,
      lastChats: undefined,
      toast: undefined,
      // The sample's summary and alert name a sample workspace and chat. The summary counts the first workspace's
      // panes, and none shows with no workspace; the live alerts are set by the caller.
      status: { ...data.status, summary: summaryOf(workspaces[0], layouts), alert: undefined },
      ...(data.chatMenu === undefined
        ? {}
        : { chatMenu: data.chatMenu.filter((a) => a.value !== 'subagents' && a.value !== 'folders') }),
    },
    ui: {
      ...state.ui,
      focusedPane: focused ?? state.ui.focusedPane,
      layouts,
      sideChatOpen: false,
      subagentsOpen: false,
    },
  }
}

/**
 * How long the live read waits for the server, in ms: the owner's decision under d-101, 8 s, as a read over the
 * tailnet takes under 1 s.
 */
export const liveReadTimeoutMs = 8000

/**
 * A live read that missed in a way the page expects; `message` says what happened, for the status bar and the
 * ErrorTray, with the error body's message when there is one. Each kind has its own notice (`noticeOf`).
 * - `unreachable`: the server gave no answer. The request failed (`status` undefined: the server or the tailnet is
 *   down), or a 5xx came with a body that is not an error body: the Vite proxy or `tailscale serve` answered for a
 *   server that is down, as the server answers every error with one (d-115).
 * - `timeout`: no answer came within `liveReadTimeoutMs`.
 * - `herdr-unavailable` (503) and `herdr-bad-reply` (502): the server could not reach herdr, or could not read its
 *   reply.
 * - `forbidden`: the server refused this viewer (403, or a 401 or 403 with no error body).
 * - `internal`: the server failed (500).
 * - `status`: any other error status; `errorKind` is the error body's kind when it has one.
 * `requestId` is the error body's, else the answer's `X-Request-Id` header.
 */
export type LiveMiss =
  | {
      readonly kind: 'unreachable'
      readonly status: number | undefined
      readonly requestId: string | undefined
      readonly message: string
    }
  | { readonly kind: 'timeout'; readonly requestId: undefined; readonly message: string }
  | {
      readonly kind: 'herdr-unavailable' | 'herdr-bad-reply' | 'internal'
      readonly requestId: string
      readonly message: string
    }
  | {
      readonly kind: 'forbidden'
      readonly status: number
      readonly requestId: string | undefined
      readonly message: string
    }
  | {
      readonly kind: 'status'
      readonly status: number
      readonly errorKind: ErrorKind['kind'] | undefined
      readonly requestId: string | undefined
      readonly message: string
    }

/** The miss of an answer with a status that is not 2xx, its body as text, which may not be JSON, and its header. */
function missOf(status: number, body: string, headerRequestId: string | undefined): LiveMiss {
  const parsed = ErrorBody.safeParse(readJson(body))
  const error = parsed.success ? parsed.data.error : undefined
  const requestId = error?.requestId ?? headerRequestId
  const detail =
    error === undefined
      ? requestId === undefined
        ? ''
        : ` (request ${requestId})`
      : `: ${error.message} (${error.kind}, request ${error.requestId})`
  const message = `the server answered ${String(status)}${detail}`
  if (error?.kind === 'herdr-unavailable' || error?.kind === 'herdr-bad-reply' || error?.kind === 'internal')
    return { kind: error.kind, requestId: error.requestId, message }
  if (error?.kind === 'forbidden' || (error === undefined && (status === 401 || status === 403)))
    return { kind: 'forbidden', status, requestId, message }
  if (error === undefined && status >= 500) return { kind: 'unreachable', status, requestId, message }
  return { kind: 'status', status, errorKind: error?.kind, requestId, message }
}

/** `signal` ended the read on its timeout (AbortSignal.timeout), not on a navigation or a cancel. */
const timedOut = (signal: AbortSignal) =>
  signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'

/** What a read needs of the RPC client's answer. */
type Answer = {
  readonly ok: boolean
  readonly status: number
  readonly headers: Headers
  text: () => Promise<string>
  json: () => Promise<unknown>
}

/**
 * Reads the server through the RPC client (`call`) and checks the answer with `parse`, the contract's schema. The
 * status comes first: an error answer may not be JSON (the Vite proxy or `tailscale serve` with the server down), so
 * its body is read as text and parsed only if it can be. An expected miss is the Result's error; a reply the contract
 * refuses throws. `signal` ends the read: on its timeout the read is a `timeout` miss; on any other abort, such as the
 * owner leaving the page, it throws the abort.
 */
export async function readChecked<T>(
  call: (signal: AbortSignal) => Promise<Answer>,
  parse: (body: unknown) => T,
  signal: AbortSignal,
): Promise<Result<T, LiveMiss>> {
  const timeout = {
    kind: 'timeout',
    requestId: undefined,
    message: `the server did not answer within ${String(liveReadTimeoutMs / 1000)} s`,
  } as const
  let res: Answer
  try {
    res = await call(signal)
  } catch (thrown) {
    if (timedOut(signal)) return err(timeout)
    // fetch rejects with a TypeError when no answer comes: the server or the tailnet cannot be reached.
    if (thrown instanceof TypeError && !signal.aborted)
      return err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' })
    throw thrown
  }
  try {
    if (!res.ok) return err(missOf(res.status, await res.text(), res.headers.get('X-Request-Id') ?? undefined))
    const body: unknown = await res.json()
    return ok(parse(body))
  } catch (thrown) {
    // The body can stall after the headers; the timeout ends that read too.
    if (timedOut(signal)) return err(timeout)
    // The connection can drop after the headers: the body read then rejects with a TypeError, and the answer never
    // came in full. A body that is not JSON (SyntaxError) or that the contract refuses (ZodError) still throws.
    if (thrown instanceof TypeError && !signal.aborted)
      return err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' })
    throw thrown
  }
}

/** Reads the workspaces and checks them against the contract (`readChecked`). */
export function fetchWorkspaces(signal: AbortSignal): Promise<Result<WorkspacesResponse, LiveMiss>> {
  return readChecked(
    (init) => api.api.workspaces.$get(undefined, { init: { signal: init } }),
    (body) => WorkspacesResponse.parse(body),
    signal,
  )
}

/** Reads one workspace's tabs and panes, its ID URL-encoded, and checks them against the contract (`readChecked`). */
function fetchLayout(workspace: WorkspaceId, signal: AbortSignal): Promise<Result<LayoutResponse, LiveMiss>> {
  return readChecked(
    (init) =>
      api.api.workspaces[':workspace'].layout.$get(
        { param: { workspace: encodeURIComponent(workspace) } },
        { init: { signal: init } },
      ),
    (body) => LayoutResponse.parse(body),
    signal,
  )
}

/**
 * `pending`, or its rejection with `signal`'s reason once `signal` aborts: the load stops waiting, and `pending`
 * goes on for the loads that share it.
 */
function untilAborted<T>(pending: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (signal === undefined) return pending
  return new Promise<T>((resolve, reject) => {
    const stop = () => {
      reject(signal.reason instanceof Error ? signal.reason : new DOMException('The load was aborted.', 'AbortError'))
    }
    if (signal.aborted) stop()
    signal.addEventListener('abort', stop, { once: true })
    pending.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', stop)
    })
  })
}

/**
 * A layout read that missed, for report(): a stable name, and in its message only the miss's kind and status, never
 * text from the server (the 2b-5 sender posts reports to the server).
 */
class LayoutReadMissError extends Error {
  readonly miss: LiveMiss['kind']

  constructor(miss: LiveMiss) {
    const status = 'status' in miss && miss.status !== undefined ? ` ${String(miss.status)}` : ''
    const errorKind = miss.kind === 'status' && miss.errorKind !== undefined ? ` ${miss.errorKind}` : ''
    super(`A workspace layout read missed: ${miss.kind}${status}${errorKind}`)
    this.name = 'LayoutReadMissError'
    this.miss = miss.kind
  }
}

/** The status bar's line while a layout read misses: the page draws each such workspace's first chats. */
const layoutMissLine = `Layout not live — first ${String(maxPanes)} chats`

/** A layout read missed and was reported, and no load has read every layout since: the outage goes on. */
let layoutOutage = false

/** Reports the first miss of an outage (`miss`), once; a load with no miss (`undefined`) ends the outage. */
function noteLayoutMiss(miss: LiveMiss | undefined): void {
  if (miss === undefined) {
    layoutOutage = false
    return
  }
  if (layoutOutage) return
  layoutOutage = true
  report(new LayoutReadMissError(miss), 'live')
}

/**
 * The meta of the live reads: their misses are expected and shown in the notice and the status bar, so the query
 * client does not report them (d-117).
 */
const expectedMiss = { expected: true }

/** The HTTP status a miss stands for: its own, or the one its error kind comes with; none for a timeout. */
function statusOfMiss(miss: LiveMiss): number | undefined {
  switch (miss.kind) {
    case 'herdr-unavailable':
      return 503
    case 'herdr-bad-reply':
      return 502
    case 'internal':
      return 500
    case 'timeout':
      return undefined
    case 'unreachable':
    case 'forbidden':
    case 'status':
      return miss.status
  }
}

/**
 * Carries a miss through the query client, which knows only thrown errors, to withLiveWorkspaces. Its `status` is
 * the miss's HTTP status, so the client's shouldRetry tries a 5xx, a 408 or a 429 again as for any query.
 */
class LiveMissError extends Error {
  readonly miss: LiveMiss
  readonly status: number | undefined

  constructor(miss: LiveMiss) {
    super(miss.message)
    this.name = 'LiveMissError'
    this.miss = miss
    this.status = statusOfMiss(miss)
  }
}

/** The parts that are set, in brackets after a space, such as " (502, request r-1)"; nothing when none is. */
const inBrackets = (...parts: (string | undefined)[]) => {
  const set = parts.filter((part) => part !== undefined)
  return set.length === 0 ? '' : ` (${set.join(', ')})`
}

/**
 * The notice over every layout when the live read missed: the same title for each miss, which says what the page
 * shows, and what happened, one text for each kind. The notice's Retry reads the server again.
 */
function noticeOf(miss: LiveMiss): { title: string; description: string } {
  const title = 'Live data unavailable — no workspaces shown'
  const request = miss.requestId === undefined ? undefined : `request ${miss.requestId}`
  switch (miss.kind) {
    case 'unreachable':
      return {
        title,
        description: `The-bridge server did not answer${miss.status === undefined ? '' : inBrackets(String(miss.status), request)}. Start it or check the tailnet, then retry.`,
      }
    case 'timeout':
      return {
        title,
        description: `The-bridge server took more than ${String(liveReadTimeoutMs / 1000)} seconds to answer. Check that it is not stuck, then retry.`,
      }
    case 'herdr-unavailable':
      return { title, description: `Herdr is not available on the server${inBrackets(request)}. Start it, then retry.` }
    case 'herdr-bad-reply':
      return {
        title,
        description: `The server could not read herdr's reply${inBrackets(request)}. Check the server's log, then retry.`,
      }
    case 'forbidden':
      return { title, description: `The server refused this device${inBrackets(String(miss.status), request)}.` }
    case 'internal':
      return {
        title,
        description: `The server failed while it read the workspaces${inBrackets(request)}. Check its log, then retry.`,
      }
    case 'status':
      return { title, description: `The server answered ${String(miss.status)}${inBrackets(miss.errorKind, request)}.` }
  }
}

const queryKey = ['workspaces']
/** A workspace's layout in the query cache, under the list's key, so whatever marks the list invalid marks it too. */
const layoutKey = (workspace: string): QueryKey => ['workspaces', 'layout', workspace]

/** How many watchers are open; while one is, the cache is current. */
let watching = 0
/** Why the live updates stopped, shown in the status bar until a new watcher starts. */
let stopped: string | undefined
/** The event stream's last error while it connects again, shown in the status bar until a stream opens. */
let lost: string | undefined
/** How many events the watchers took; a read that saw it change while it ran may hold older data. */
let taken = 0
/** How many `layout.changed` events the watchers took for each workspace, by ID, as `taken` counts for the list. */
const layoutsTaken = new Map<string, number>()
/**
 * The workspaces of the last list a load read, by ID: the page shows their layouts. A `layout.changed` event for one
 * of them reads it again even when its query is gone, as the query client drops a query no component observes after
 * five idle minutes.
 */
const shownWorkspaces = new Set<string>()
/** The open watcher's way to mark the cache invalid (the list and every layout, or the query of `key`) and load again. */
let reload: ((key?: QueryKey) => void) | undefined

/** Opens the event stream; `signal` aborts it. */
type OpenStream = (signal: AbortSignal) => Promise<Response>

export type WatchDeps = {
  /** Called after the cache changed, at most once each `settleMs`: the page loads its state again. */
  readonly onChange: () => void
  readonly client?: QueryClient
  readonly open?: OpenStream
  readonly settleMs?: number
}

/** One server-sent event: its name and its data. */
export type Frame = { readonly event: string; readonly data: string; readonly retry: number | undefined }

/** The SSE frames of `body` as they come; comment lines (the server's pings) give none. */
export async function* frames(body: ReadableStream<Uint8Array>): AsyncGenerator<Frame> {
  const decoder = new TextDecoder()
  const reader = body.getReader()
  let text = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      text += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n')
      for (let at = text.indexOf('\n\n'); at !== -1; at = text.indexOf('\n\n')) {
        const block = text.slice(0, at)
        text = text.slice(at + 2)
        let event = 'message'
        const data: string[] = []
        let retry: number | undefined
        for (const line of block.split('\n')) {
          if (line.startsWith(':')) continue
          const colon = line.indexOf(':')
          const key = colon === -1 ? line : line.slice(0, colon)
          const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
          if (key === 'event') event = value
          else if (key === 'data') data.push(value)
          else if (key === 'retry' && /^\d+$/.test(value)) retry = Number(value)
        }
        if (data.length > 0 || retry !== undefined) yield { event, data: data.join('\n'), retry }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** The new cache for one chat's status, or undefined when the cache does not hold the chat. */
function withStatus(
  cached: WorkspacesResponse | undefined,
  event: Extract<LiveEvent, { type: 'chat.status' }>,
): WorkspacesResponse | undefined {
  const { chat, status } = event.data
  if (!cached?.workspaces.some((w) => w.chats.some((c) => c.id === chat))) return undefined
  return {
    ...cached,
    workspaces: cached.workspaces.map((w) => ({
      ...w,
      chats: w.chats.map((c) => (c.id === chat ? { ...c, status } : c)),
    })),
  }
}

/** The JSON in `text`, or undefined when it is not JSON. */
export function readJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const openEvents: OpenStream = (signal) =>
  api.api.events.$get(undefined, { init: { signal, headers: { Accept: 'text/event-stream' } } })

/**
 * Reads the event stream and keeps the workspaces in the query cache current: a `chat.status` event changes
 * the chat's status there; `workspaces.changed`, an event the cache cannot take, and each time the stream
 * opens (the first time and after it connects again) mark the cache invalid, with every layout, so the next load
 * reads the server. A `layout.changed` event marks that workspace's layout invalid, and only when the page shows that
 * workspace (`shownWorkspaces`): a workspace the page does not show is not read. A burst of events gives one
 * `onChange`. When the stream ends or the network drops, it connects again after the server's retry time (5 s), as EventSource does, and shows the error in the status bar and the
 * dev ErrorTray once for each outage; a 5xx is an outage too, as the Vite proxy answers 5xx while the server is down.
 * When the server refuses the stream (such as 403), it stops and shows a notice in the status bar and the dev
 * ErrorTray, as a failed read does. The result stops it.
 */
export function watchLiveWorkspaces({
  onChange,
  client = queryClient,
  open = openEvents,
  settleMs = 100,
}: WatchDeps): () => void {
  watching += 1
  stopped = undefined
  lost = undefined
  const abort = new AbortController()
  let retryMs = 5000
  let timer: ReturnType<typeof setTimeout> | undefined
  const changed = () => {
    timer ??= setTimeout(() => {
      timer = undefined
      onChange()
    }, settleMs)
  }
  const invalidate = (key: QueryKey = queryKey) => {
    void client.invalidateQueries({ queryKey: key, refetchType: 'none' })
    changed()
  }
  reload = invalidate
  const takeLayout = (frame: Frame) => {
    const parsed = LiveEvent.safeParse(readJson(frame.data))
    // An event the page cannot read may name any workspace: read them all again.
    if (!parsed.success || parsed.data.type !== 'layout.changed') {
      invalidate()
      return
    }
    const { workspace } = parsed.data.data
    layoutsTaken.set(workspace, (layoutsTaken.get(workspace) ?? 0) + 1)
    if (!shownWorkspaces.has(workspace)) return
    invalidate(layoutKey(workspace))
  }
  const take = (frame: Frame) => {
    if (frame.retry !== undefined) retryMs = frame.retry
    if (frame.event === 'layout.changed') {
      takeLayout(frame)
      return
    }
    if (frame.event === 'open' || frame.event === 'workspaces.changed' || frame.event === 'chat.status') taken += 1
    if (frame.event === 'open' || frame.event === 'workspaces.changed') {
      invalidate()
      return
    }
    if (frame.event !== 'chat.status') return
    // An invalid cache stays invalid: the next load reads the server, which has this status too.
    if (client.getQueryState(queryKey)?.isInvalidated === true) {
      changed()
      return
    }
    const parsed = LiveEvent.safeParse(readJson(frame.data))
    const next =
      parsed.success && parsed.data.type === 'chat.status'
        ? withStatus(client.getQueryData<WorkspacesResponse>(queryKey), parsed.data)
        : undefined
    if (next === undefined) {
      invalidate()
      return
    }
    client.setQueryData(queryKey, next)
    changed()
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
        // A 5xx is the server or its proxy with no answer for now, such as the Vite proxy while the server is down:
        // connect again, so the page loads again, and the notice goes, once the server answers.
        if (res.status >= 500) throw new Error(`the server answered ${String(res.status)} for the event stream`)
        if (!res.ok || res.body === null) {
          stopped = `Live updates stopped (the server answered ${String(res.status)} for the event stream); reload the page to start them again.`
          // The status bar says it; a refused stream is a state the page shows, not a report.
          changed()
          return
        }
        // The stream is open: the outage, if there was one, is over.
        lost = undefined
        for await (const frame of frames(res.body)) take(frame)
      } catch (thrown) {
        // The watcher stopped (the page closed the stream; fetch rejects with an AbortError): end, with no report.
        if (closed() || (thrown instanceof DOMException && thrown.name === 'AbortError')) return
        // The network dropped: keep the error for the status bar and connect again after the retry time. A long
        // outage tells the page once, on its first error, not once for each reconnect; the status bar says it, so it
        // is not reported.
        const first = lost === undefined
        const why = thrown instanceof Error ? thrown.message : String(thrown)
        lost = `Live updates lost the event stream (${why}); connecting again.`
        if (first) changed()
      }
      await pause()
    }
  }
  void run()
  return () => {
    if (reload === invalidate) reload = undefined
    watching -= 1
    // The owner left the page: a layout miss on his next visit is reported again.
    if (watching === 0) layoutOutage = false
    clearTimeout(timer)
    abort.abort()
  }
}

export type LiveDeps = {
  readonly client?: QueryClient
  /** Reads the server; `signal` ends the read. */
  readonly fetch?: (signal: AbortSignal) => Promise<Result<WorkspacesResponse, LiveMiss>>
  /** Reads one workspace's layout; `signal` ends the read. */
  readonly fetchLayout?: (workspace: WorkspaceId, signal: AbortSignal) => Promise<Result<LayoutResponse, LiveMiss>>
  /** The router's signal for this load: it aborts when the owner leaves the page or the load starts again. */
  readonly signal?: AbortSignal | undefined
}

/**
 * `state` with the server's workspaces and a pane for each chat (`liveOnly`), or with no workspaces and a notice
 * when the read missed (`LiveMiss`), never the sample ones. The notice shows over every layout (`liveNotice`), in
 * the status bar, which only the workbench layout shows, and in the dev ErrorTray; the live source is development
 * only. Anything else that throws, such as a reply the contract refuses or a bug in the mapper, rejects, so the
 * route shows RouteError and not mock data. The read ends after `liveReadTimeoutMs` (a `timeout` miss) or when
 * `signal` aborts (it rejects with the abort). With no live workspaces, `current` is null.
 */
export async function withLiveWorkspaces(
  state: WorkspacesScreenState,
  { client = queryClient, fetch = fetchWorkspaces, fetchLayout: readLayout = fetchLayout, signal }: LiveDeps = {},
): Promise<WorkspacesScreenState> {
  // While the events keep the cache current, a load reads the cache; an event that cannot be applied to it
  // marks it invalid, and then the load reads the server.
  // An event during the read may be newer than the read's answer, so the cache is then marked invalid again
  // once it holds the answer, and the page loads once more.
  // The read ends on the query's cancel or the timeout, whichever comes first. It is shared by every load while it
  // runs, so the router's abort of one load does not end it: a burst of events reloads the page, and each reload
  // aborts the one before, which would otherwise start the read again each time.
  const read = async ({ signal: cancel }: { signal: AbortSignal }) => {
    const before = taken
    const answer = await fetch(AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
    if (!answer.ok) throw new LiveMissError(answer.error)
    if (taken !== before)
      setTimeout(() => {
        reload?.()
      }, 0)
    return answer.value
  }
  let response: WorkspacesResponse
  try {
    response = await untilAborted(
      client.query({ queryKey, queryFn: read, staleTime: watching > 0 ? Infinity : 0, meta: expectedMiss }),
      signal,
    )
  } catch (thrown) {
    if (!(thrown instanceof LiveMissError)) throw thrown
    // The notice and the status bar say it: an expected miss is not reported (d-117).
    const alert = `Live data is not available (${thrown.miss.message}); the page shows no workspaces.`
    const empty = liveOnly(state, [])
    return {
      ...empty,
      data: { ...empty.data, status: { ...empty.data.status, alert }, liveNotice: noticeOf(thrown.miss) },
    }
  }
  const workspaces = toWorkspaces(response)
  const herdr = await untilAborted(layoutsOf(response, workspaces, client, readLayout), signal)
  noteLayoutMiss(herdr.missed)
  const live = liveOnly(state, workspaces, response.machine, herdr.layouts)
  const alert = stopped ?? lost
  const hints = herdr.missed === undefined ? live.data.status.hints : [layoutMissLine, ...live.data.status.hints]
  return {
    ...live,
    data: { ...live.data, status: { ...live.data.status, hints, ...(alert === undefined ? {} : { alert }) } },
  }
}

/**
 * The herdr layout of each workspace of `response` as the page's own (`layoutOfTab`), by the page's workspace ID, each
 * read through the query client as the list is, so the loads of a burst share one read, and the first miss when a
 * read missed. A workspace whose read missed has no layout, so the page keeps its first chats (`liveOnly`). A layout
 * the contract refuses rejects, for RouteError.
 */
async function layoutsOf(
  response: WorkspacesResponse,
  workspaces: readonly Workspace[],
  client: QueryClient,
  fetch: NonNullable<LiveDeps['fetchLayout']>,
): Promise<{ layouts: Map<string, WorkspaceLayout>; missed: LiveMiss | undefined }> {
  const read =
    (id: WorkspaceId) =>
    async ({ signal: cancel }: { signal: AbortSignal }) => {
      const before = [taken, layoutsTaken.get(id) ?? 0]
      const answer = await fetch(id, AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
      if (!answer.ok) throw new LiveMissError(answer.error)
      // An event during the read may be newer than its answer: read this layout again once the answer is cached.
      if (before[0] !== taken || before[1] !== (layoutsTaken.get(id) ?? 0))
        setTimeout(() => {
          reload?.(layoutKey(id))
        }, 0)
      return answer.value
    }
  shownWorkspaces.clear()
  for (const summary of response.workspaces) shownWorkspaces.add(summary.id)
  const pairs = await Promise.all(
    response.workspaces.map(async (summary, at): Promise<[string, WorkspaceLayout] | LiveMiss | undefined> => {
      const workspace = workspaces[at]
      if (workspace === undefined) return undefined
      try {
        const layout = await client.query({
          queryKey: layoutKey(summary.id),
          queryFn: read(summary.id),
          staleTime: watching > 0 ? Infinity : 0,
          meta: expectedMiss,
        })
        return [workspace.id, layoutOfTab(layout.tabs)]
      } catch (thrown) {
        if (thrown instanceof LiveMissError) return thrown.miss
        throw thrown
      }
    }),
  )
  const layouts = new Map<string, WorkspaceLayout>()
  let missed: LiveMiss | undefined
  for (const pair of pairs) {
    if (Array.isArray(pair)) layouts.set(pair[0], pair[1])
    else missed ??= pair
  }
  return { layouts, missed }
}
