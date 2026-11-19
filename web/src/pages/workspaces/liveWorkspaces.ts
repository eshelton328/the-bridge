// The live source of the Workspaces page (`?source=live`, development
// only): the workspaces and chats from the-bridge server, through the Hono
// RPC client and the query client, mapped to the page's view model and put
// on its home state. The other parts of the page stay the home's in slice 1.
// When the server is down or answers an error, the page keeps the home's
// mock data, the status bar says why, and the dev ErrorTray lists it.
// Slice 2: while the page shows, watchLiveWorkspaces keeps the query cache
// current from the server's events (`GET /api/events`, SSE) and tells the
// page to load again, at most once each `settleMs`.
import { type ChatSummary, LiveEvent, splitId, type WorkspaceSummary, WorkspacesResponse } from '@bridge/contract'
import type { QueryClient } from '@tanstack/react-query'
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

/** Reads the workspaces through the RPC client and checks them against the contract. */
async function fetchWorkspaces(): Promise<WorkspacesResponse> {
  const res = await api.api.workspaces.$get()
  const body: unknown = await res.json()
  if (!res.ok) {
    const reason = typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : ''
    throw new Error(`the server answered ${String(res.status)}${reason ? `: ${reason}` : ''}`)
  }
  return WorkspacesResponse.parse(body)
}

const queryKey = ['workspaces']

/** How many watchers are open; while one is, the cache is current. */
let watching = 0
/** Why the live updates stopped, shown in the status bar until a new watcher starts. */
let stopped: string | undefined
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
 * again after the server's retry time (5 s), as EventSource does; when the server refuses the stream (403,
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
  const run = async () => {
    while (!abort.signal.aborted) {
      try {
        const res = await open(abort.signal)
        if (!res.ok || res.body === null) {
          stopped = `Live updates stopped (the server answered ${String(res.status)} for the event stream); reload the page to start them again.`
          report(new Error(stopped), 'handler')
          changed()
          return
        }
        for await (const frame of frames(res.body)) take(frame)
      } catch {
        // The network dropped or the watcher stopped: connect again after the retry time, or end.
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

export type LiveDeps = { readonly client: QueryClient; readonly fetch: () => Promise<WorkspacesResponse> }

/**
 * `state` with the server's workspaces, or with its own data and a notice when they cannot be read. The
 * notice goes to the status bar, which only the workbench layout shows, and to the dev ErrorTray, which
 * main.ts renders beside the router in every layout; the live source is development only.
 */
export async function withLiveWorkspaces(
  state: WorkspacesScreenState,
  { client, fetch }: LiveDeps = { client: queryClient, fetch: fetchWorkspaces },
): Promise<WorkspacesScreenState> {
  try {
    // While the events keep the cache current, a load reads the cache; an event that cannot be applied to it
    // marks it invalid, and then the load reads the server.
    // An event during the read may be newer than the read's answer, so the cache is then marked invalid again
    // once it holds the answer, and the page loads once more.
    const read = async () => {
      const before = taken
      const answer = await fetch()
      if (taken !== before)
        setTimeout(() => {
          reload?.()
        }, 0)
      return answer
    }
    const response = await client.query({ queryKey, queryFn: read, staleTime: watching > 0 ? Infinity : 0 })
    const workspaces = toWorkspaces(response)
    const status = stopped === undefined ? state.data.status : { ...state.data.status, alert: stopped }
    return { ...state, data: { ...state.data, status, workspaces, current: workspaces[0]?.id ?? state.data.current } }
  } catch (thrown) {
    const why = thrown instanceof Error ? thrown.message : String(thrown)
    const alert = `Live data is not available (${why}); the page shows mock data.`
    report(new Error(alert, { cause: thrown }), 'handler')
    return { ...state, data: { ...state.data, status: { ...state.data.status, alert } } }
  }
}
