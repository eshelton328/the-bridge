// The live source of the Workspaces page (`?source=live`, development
// only): the workspaces and chats from the-bridge server, through the Hono
// RPC client and the query client, mapped to the page's view model and put
// on its home state. The other parts of the page stay the home's in slice 1.
// When the read misses in a way the page expects (the server cannot be
// reached, refuses this viewer or answers an error status), the page keeps
// the home's mock data and says so in a notice over every layout, in the
// status bar and in the dev ErrorTray. A reply the contract refuses or a bug
// in the mapper is not a miss: it throws, and the route shows RouteError.
// Slice 2: while the page shows, watchLiveWorkspaces keeps the query cache
// current from the server's events (`GET /api/events`, SSE) and tells the
// page to load again, at most once each `settleMs`.
import {
  type ChatSummary,
  ErrorBody,
  type ErrorKind,
  LiveEvent,
  splitId,
  type WorkspaceSummary,
  WorkspacesResponse,
} from '@bridge/contract'
import type { QueryClient } from '@tanstack/react-query'
import { err, ok, type Result } from '@bridge/shared'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { queryClient } from '../../lib/queryClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type { SidebarChat, Workspace, WorkspacesData, WorkspacesUi } from './types.ts'

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
    ...(chat.contextUsed === null ? {} : { context: Math.round(chat.contextUsed * 100) }),
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
 * A live read that missed in a way the page expects; `message` says what happened, for the status bar and the
 * ErrorTray, with the error body's message when there is one.
 * - `unreachable`: the server gave no answer. The request failed (`status` undefined: the server or the tailnet is
 *   down), or the Vite proxy or `tailscale serve` answered 502 or 503 with a body that is not an error body.
 * - `herdr-unavailable`: the server answered that herdr is not available (503).
 * - `refused`: the server refused this viewer (401 or 403).
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
  | { readonly kind: 'herdr-unavailable'; readonly requestId: string; readonly message: string }
  | {
      readonly kind: 'refused'
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
  if (error?.kind === 'herdr-unavailable') return { kind: 'herdr-unavailable', requestId: error.requestId, message }
  if (status === 401 || status === 403) return { kind: 'refused', status, requestId, message }
  if (error === undefined && (status === 502 || status === 503))
    return { kind: 'unreachable', status, requestId, message }
  return { kind: 'status', status, errorKind: error?.kind, requestId, message }
}

/**
 * Reads the workspaces through the RPC client and checks them against the contract. The status comes first: an
 * error answer may not be JSON (the Vite proxy or `tailscale serve` with the server down), so its body is read as
 * text and parsed only if it can be. An expected miss is the Result's error; a reply the contract refuses throws.
 */
export async function fetchWorkspaces(): Promise<Result<WorkspacesResponse, LiveMiss>> {
  let res: Awaited<ReturnType<typeof api.api.workspaces.$get>>
  try {
    res = await api.api.workspaces.$get()
  } catch (thrown) {
    // fetch rejects with a TypeError when no answer comes: the server or the tailnet cannot be reached.
    if (thrown instanceof TypeError)
      return err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' })
    throw thrown
  }
  if (!res.ok) return err(missOf(res.status, await res.text(), res.headers.get('X-Request-Id') ?? undefined))
  const body: unknown = await res.json()
  return ok(WorkspacesResponse.parse(body))
}

/** Carries a miss through the query client, which knows only thrown errors, to withLiveWorkspaces. */
class LiveMissError extends Error {
  readonly miss: LiveMiss

  constructor(miss: LiveMiss) {
    super(miss.message)
    this.name = 'LiveMissError'
    this.miss = miss
  }
}

/** The notice over every layout when the live read missed: the same title for each miss, and what happened. */
function noticeOf(miss: LiveMiss): { title: string; description: string } {
  const title = 'Live data unavailable — showing sample data'
  const request = miss.requestId === undefined ? '' : `, request ${miss.requestId}`
  switch (miss.kind) {
    case 'unreachable':
      return {
        title,
        description:
          miss.status === undefined
            ? 'The-bridge server did not answer. Start it or check the tailnet, then reload.'
            : `The-bridge server did not answer (${String(miss.status)}${request}). Start it or check the tailnet, then reload.`,
      }
    case 'herdr-unavailable':
      return {
        title,
        description: `Herdr is not available on the server (request ${miss.requestId}). Start it, then reload.`,
      }
    case 'refused':
      return { title, description: `The server refused this device (${String(miss.status)}${request}).` }
    case 'status':
      return {
        title,
        description:
          miss.errorKind === undefined
            ? `The server answered ${String(miss.status)}${miss.requestId === undefined ? '' : ` (request ${miss.requestId})`}.`
            : `The server answered ${String(miss.status)} (${miss.errorKind}${request}).`,
      }
  }
}

const queryKey = ['workspaces']

/** How many watchers are open; while one is, the cache is current. */
let watching = 0
/** Why the live updates stopped, shown in the status bar until a new watcher starts. */
let stopped: string | undefined
/** The event stream's last error while it connects again, shown in the status bar until a stream opens. */
let lost: string | undefined
/** How many events the watchers took; a read that saw it change while it ran may hold older data. */
let taken = 0
/** The open watcher's way to mark the cache invalid and load again. */
let reload: (() => void) | undefined

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
type Frame = { readonly event: string; readonly data: string; readonly retry: number | undefined }

/** The SSE frames of `body` as they come; comment lines (the server's pings) give none. */
async function* frames(body: ReadableStream<Uint8Array>): AsyncGenerator<Frame> {
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
function readJson(text: string): unknown {
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
 * opens (the first time and after it connects again) mark the cache invalid, so the next load reads the
 * server. A burst of events gives one `onChange`. When the stream ends or the network drops, it connects
 * again after the server's retry time (5 s), as EventSource does, and shows the error in the status bar and the
 * dev ErrorTray once for each outage; when the server refuses the stream (403,
 * 502), it stops and shows a notice in the status bar and the dev ErrorTray, as a failed read does. The
 * result stops it.
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
  const invalidate = () => {
    void client.invalidateQueries({ queryKey, refetchType: 'none' })
    changed()
  }
  reload = invalidate
  const take = (frame: Frame) => {
    if (frame.retry !== undefined) retryMs = frame.retry
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
        if (!res.ok || res.body === null) {
          stopped = `Live updates stopped (the server answered ${String(res.status)} for the event stream); reload the page to start them again.`
          report(new Error(stopped), 'handler')
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
        // outage reports once, on its first error, not once for each reconnect.
        const first = lost === undefined
        const why = thrown instanceof Error ? thrown.message : String(thrown)
        lost = `Live updates lost the event stream (${why}); connecting again.`
        if (first) {
          report(new Error(lost, { cause: thrown }), 'handler')
          changed()
        }
      }
      await pause()
    }
  }
  void run()
  return () => {
    if (reload === invalidate) reload = undefined
    watching -= 1
    clearTimeout(timer)
    abort.abort()
  }
}

export type LiveDeps = {
  readonly client: QueryClient
  readonly fetch: () => Promise<Result<WorkspacesResponse, LiveMiss>>
}

/**
 * `state` with the server's workspaces, or with its own data and a notice when the read missed (`LiveMiss`). The
 * notice shows over every layout (`liveNotice`), in the status bar, which only the workbench layout shows, and in
 * the dev ErrorTray; the live source is development only. Anything else that throws, such as a reply the contract
 * refuses or a bug in the mapper, rejects, so the route shows RouteError and not mock data.
 */
export async function withLiveWorkspaces(
  state: WorkspacesScreenState,
  { client, fetch }: LiveDeps = { client: queryClient, fetch: fetchWorkspaces },
): Promise<WorkspacesScreenState> {
  // While the events keep the cache current, a load reads the cache; an event that cannot be applied to it
  // marks it invalid, and then the load reads the server.
  // An event during the read may be newer than the read's answer, so the cache is then marked invalid again
  // once it holds the answer, and the page loads once more.
  const read = async () => {
    const before = taken
    const answer = await fetch()
    if (!answer.ok) throw new LiveMissError(answer.error)
    if (taken !== before)
      setTimeout(() => {
        reload?.()
      }, 0)
    return answer.value
  }
  let response: WorkspacesResponse
  try {
    response = await client.query({ queryKey, queryFn: read, staleTime: watching > 0 ? Infinity : 0 })
  } catch (thrown) {
    if (!(thrown instanceof LiveMissError)) throw thrown
    const alert = `Live data is not available (${thrown.miss.message}); the page shows mock data.`
    report(new Error(alert, { cause: thrown }), 'handler')
    return {
      ...state,
      data: { ...state.data, status: { ...state.data.status, alert }, liveNotice: noticeOf(thrown.miss) },
    }
  }
  const workspaces = toWorkspaces(response)
  const alert = stopped ?? lost
  const status = alert === undefined ? state.data.status : { ...state.data.status, alert }
  return { ...state, data: { ...state.data, status, workspaces, current: workspaces[0]?.id ?? state.data.current } }
}
