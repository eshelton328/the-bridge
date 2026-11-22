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
// refuses does. A layout read that gets no answer at all (no status) while
// the page is hidden, after it hid during the read or within 5 s after it
// showed again is iOS closing it in the background (pageResume.ts): no
// report and no line, and the read goes again once the page shows, at once
// if it does; one such miss for each trip, as a transcript stream has. An
// answer from the server (any status) is reported as before. The list read
// (`GET /api/workspaces`) takes the same rule: such a miss shows no notice,
// and the list is read again once the page shows; a second one in the same
// trip, or any answer from the server, shows the notice as before.
// Review R43: a server restart ends the event stream. Its miss is quiet for
// `reconnectGraceMs`: the status bar says the stream is lost only when a
// miss comes after that window, and a stream that opens ends the outage.
// Review R34: the home's sample skills never reach the live page; each live
// Claude chat's "/" list is read from the server when it opens (liveSkills.ts).
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
import { type Frame, frames } from '../../lib/eventFrames.ts'
import { queryClient } from '../../lib/queryClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { modelFamilies } from './blocks/modelFamilies.ts'
import { maxPanes } from './blocks/workspaceLayout.ts'
import { layoutOfTab, liveTabsOf } from './liveLayout.ts'
import { liveNewChatForm } from './liveNewChatForm.ts'
import {
  followPageVisibility,
  fromBackground,
  hidesSoFar,
  isHidden,
  type ResumeMark,
  resumeMark,
  whenVisible,
} from '../../lib/pageResume.ts'
import type {
  LiveTab,
  PaneAction,
  PhoneText,
  SidebarChat,
  WorkbenchPane,
  Workspace,
  WorkspaceLayout,
  WorkspacesData,
  WorkspacesUi,
} from './types.ts'

type WorkspacesScreenState = ScreenState<WorkspacesData, WorkspacesUi>

const isFamily = (name: string): name is keyof typeof modelFamilies => Object.hasOwn(modelFamilies, name)

/**
 * A model ID as the app writes it: "claude-opus-5-5" is "Opus 5.5", "gpt-5.5" is "GPT-5.5". A family alone, as the
 * list gives a chat restarted with a new model until its next turn (W10, backend #390), is the family: "sonnet" is
 * "Sonnet".
 */
export function modelLabel(model: string): string {
  if (isFamily(model)) return modelFamilies[model]
  const claude = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model)
  const family = claude?.[1]
  if (claude && family !== undefined && isFamily(family))
    return `${modelFamilies[family]} ${claude[2] ?? ''}.${claude[3] ?? ''}`
  if (model.startsWith('gpt-')) return `GPT-${model.slice(4)}`
  return model
}

const kindLabels = { claude: 'Claude Code', codex: 'Codex', shell: 'shell' } as const

/** The label of an idle chat; an `unknown` one has the idle tone too, with its own label. */
const idleLabel = 'Idle'

/**
 * The server sends /compact and /clear only to a Claude chat that is idle or done (backend #317, W5); every other
 * status, `unknown` too, is refused, so the commands are off.
 */
const takesCommands = (status: SidebarChat['status']) =>
  status.tone === 'done' || (status.tone === 'idle' && status.label === idleLabel)

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
      return { label: idleLabel, tone: 'idle' }
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
    // W5: the effort as Claude Code's `/effort` names it, as Figma writes "high effort"; none when not known.
    ...(chat.effort === null ? {} : { effort: `${chat.effort} effort`, effortLevel: chat.effort }),
    ...(chat.kind !== 'claude' || chat.modelId === null ? {} : { modelId: chat.modelId }),
    pane: chat.pane,
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
      // The pane header shows the model as text (d-101, W5). A live Claude chat's chat header picks its model and its
      // effort (W10, ChatHead), from the family and the level the list gives.
      const head = {
        kind: chat.kind,
        title: chat.title,
        model: chat.model,
        ...(chat.context === undefined ? {} : { context: chat.context }),
        status: chat.status,
        ...(chat.effort === undefined ? {} : { effort: chat.effort }),
        ...(chat.effortLevel === undefined ? {} : { effortLevel: chat.effortLevel }),
        ...(chat.modelId === undefined ? {} : { modelId: chat.modelId }),
        readOnlyModel: true,
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
        ...(claude
          ? { liveChat: `${machine}/${chat.id}`, takesCommands: takesCommands(chat.status) }
          : { notLive: notLiveText.transcript }),
      }
    }),
  )
}

/**
 * The commands a live Claude chat's actions offer (W5): `POST /api/chats/:chat/command` sends `/compact` or `/clear`.
 * No Figma frame draws them; each opens its dialog (blocks/ChatCommandDialog.tsx).
 */
const chatCommands: PaneAction[] = [
  { value: 'compact', label: 'Compact context…' },
  { value: 'clear', label: 'Clear context…' },
]

/**
 * The one sample action a live chat keeps (reviews R41, R42): New chat, which `POST /api/chats` starts. The live
 * actions follow it: Close pane… (layoutActions.ts) and /compact and /clear (`chatCommands`). Fork, Side chat,
 * Subtask, Move to workspace and Rename have no route, so a live chat does not offer them.
 */
const liveNewChat: PaneAction = { value: 'newChat', label: 'New chat' }

/** The phone's labels without Edit and Done (review R41): the live page cannot save an edit. */
function withoutEdit(text: PhoneText): PhoneText {
  const live = { ...text }
  delete live.edit
  delete live.done
  return live
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
 * subagents, folders, a workspace's last chat, the toast, the status bar's alert, the chat actions that have no route,
 * the phone's Edit). With no workspaces (an empty live
 * list or a missed read) no workspace is shown, never one of the sample's (P-3).
 */
function liveOnly(
  state: WorkspacesScreenState,
  workspaces: Workspace[],
  machine = '',
  herdr: ReadonlyMap<string, WorkspaceLayout> = new Map(),
  tabs: ReadonlyMap<string, LiveTab[]> = new Map(),
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
      // The sample's "/" list names sample skills: a live Claude chat's list is its own (review R34, skillLists.ts).
      skills: [],
      // The sample's summary and alert name a sample workspace and chat. The summary counts the first workspace's
      // panes, and none shows with no workspace; the live alerts are set by the caller.
      status: { ...data.status, summary: summaryOf(workspaces[0], layouts), alert: undefined },
      // Review R42: of the sample's chat actions only New chat works on a live chat; the others have no route.
      ...(data.chatMenu === undefined ? {} : { chatMenu: [liveNewChat] }),
      chatCommands,
      liveTabs: Object.fromEntries(tabs),
      liveMachine: machine,
      // W3: New chat starts a live Claude chat, from the phone's + and a workspace's ⋯ (M15, M14) in a new tab, from
      // the desktop's tab + (D1) in a new tab, and from a chat's actions or a pane's menu (D2b) beside that chat.
      newChat: liveNewChatForm(current ?? ''),
      paneMenu: [liveNewChat],
      ...(data.phone === undefined
        ? {}
        : {
            // Review R41: no Edit, as no route renames, orders or closes a workspace or a chat.
            phone: {
              ...withoutEdit(data.phone),
              chatMenu: [liveNewChat],
              addMenu: { newChat: 'New chat' },
              workspaceMenu: [{ value: 'newChat', label: 'New chat in {workspace}' }],
            },
          }),
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
 * How long a live stream that ended or dropped may take to connect again before the page shows it, in ms (review R43,
 * bridge-coord's decision): a restart of the server ends every stream, and the server is back within the first two
 * retries (5 s each). A miss within this window is quiet; one after it shows, as before.
 */
export const reconnectGraceMs = 10_000

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

/** A miss with no answer at all, no status: what iOS makes of a read it closes with the page in the background. */
const noAnswer = (miss: LiveMiss) =>
  miss.kind === 'timeout' || (miss.kind === 'unreachable' && miss.status === undefined)

/** For each read (its query key, as JSON), the trip to the background whose quiet miss it has had (`hidesSoFar`). */
const quietMissFor = new Map<string, number>()

/**
 * A read of `key` (the list's or a workspace's layout's query key) that started at `mark` and got no answer is the
 * close of a trip to the background (as `liveTranscript.ts` takes a stream's): any such miss while the page is hidden,
 * and the first one the visible page sees of a trip that had none while hidden. It shows no notice, gives no line and
 * is not reported; the read goes again.
 */
function quietMiss(key: QueryKey, mark: ResumeMark): boolean {
  const read = JSON.stringify(key)
  if (isHidden()) {
    quietMissFor.set(read, hidesSoFar())
    return true
  }
  if (!fromBackground(mark) || quietMissFor.get(read) === hidesSoFar()) return false
  quietMissFor.set(read, hidesSoFar())
  return true
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

followPageVisibility()

const queryKey = ['workspaces']
/** A workspace's layout in the query cache, under the list's key, so whatever marks the list invalid marks it too. */
const layoutKey = (workspace: string): QueryKey => ['workspaces', 'layout', workspace]

/** How many watchers are open; while one is, the cache is current. */
let watching = 0
/** Why the live updates stopped, shown in the status bar until a new watcher starts. */
let stopped: string | undefined
/** The event stream's last error while it connects again, shown in the status bar until a stream opens. */
let lost: string | undefined
/** The open watcher's signal: it aborts when the page closes the watcher, and ends the reads after a /clear. */
let watchSignal: AbortSignal | undefined
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

/**
 * The waits before each read of the list after a /clear the page sent, in ms. The server answers the /clear before
 * herdr lists the chat's new session ID, and it sends no event when that ID changes on its pane (W5 real run).
 */
const clearReadsMs = [300, 700, 1500, 2500] as const

export type ClearReadDeps = {
  /** Reads the server's list; `signal` ends the read. */
  readonly read?: (signal: AbortSignal) => Promise<Result<WorkspacesResponse, LiveMiss>>
  /** Waits `ms`, or less once `signal` aborts. */
  readonly wait?: (ms: number, signal: AbortSignal) => Promise<void>
  /** Ends the reads. The open watcher's signal by default, so the reads end when the page closes the watcher. */
  readonly signal?: AbortSignal | undefined
}

const waitMs = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const stop = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', stop)
      resolve()
    }, ms)
    signal.addEventListener('abort', stop, { once: true })
  })

/**
 * After a /clear of `chat` (its server ID) that the page sent: reads the server's list, one read after another, after
 * each wait of `clearReadsMs`, until `chat` has left it, then has the open watcher load the page again, so the pane
 * follow (`paneFollow.ts`) moves the open chat to the new ID. A read is its own request, never one the page's loads
 * share, so a load that started before herdr listed the new ID cannot answer it. Answers whether `chat` left the list.
 *
 * The reads end when `signal` aborts: by default when the page closes the open watcher, as it does when it unmounts.
 * They then answer false with no further read and no load; only that abort ends them quietly, any other error throws.
 * With no open watcher there is no page to load again, so there is no read. The reads went on for 5 s after the
 * page had gone and reached the real server in a later test (WorkspacesLiveCommands, the-bridge #342).
 */
export async function readAfterClear(
  chat: string,
  { read = fetchWorkspaces, wait = waitMs, signal = watchSignal }: ClearReadDeps = {},
): Promise<boolean> {
  if (signal === undefined) return false
  // A call, so that each check sees the signal as it is now.
  const ended = () => signal.aborted
  if (ended()) return false
  for (const ms of clearReadsMs) {
    await wait(ms, signal)
    if (ended()) return false
    let answer: Result<WorkspacesResponse, LiveMiss>
    try {
      answer = await read(AbortSignal.any([signal, AbortSignal.timeout(liveReadTimeoutMs)]))
    } catch (thrown) {
      if (ended() && thrown === signal.reason) return false
      throw thrown
    }
    if (ended()) return false
    if (answer.ok && !answer.value.workspaces.some((w) => w.chats.some((c) => c.id === chat))) {
      reload?.()
      return true
    }
  }
  reload?.()
  return false
}

/**
 * Reads the layout of `workspace` (its server ID) again, and the list with it when `list` is set, through the open
 * watcher: after a layout write the page's view was stale (409 singlePane or otherTab, a 404) or no `layout.changed`
 * came in time (slice W2). With no watcher (a build, a fixture) it does nothing.
 */
export function readLayoutAgain(workspace: string, list = false): void {
  reload?.(list ? queryKey : layoutKey(workspace))
}

/** Opens the event stream; `signal` aborts it. */
type OpenStream = (signal: AbortSignal) => Promise<Response>

export type WatchDeps = {
  /** Called after the cache changed, at most once each `settleMs`: the page loads its state again. */
  readonly onChange: () => void
  readonly client?: QueryClient
  readonly open?: OpenStream
  readonly settleMs?: number
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
 * `onChange`. When the stream ends or the network drops, it connects again after the server's retry time (5 s), as EventSource does. An end or a
 * miss starts an outage; a miss after `reconnectGraceMs` of it shows the error in the status bar, once for each
 * outage, and an outage that ends sooner (a server restart) shows nothing (review R43). A 5xx is a miss too, as the
 * Vite proxy answers 5xx while the server is down.
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
  watchSignal = abort.signal
  let retryMs = 5000
  let timer: ReturnType<typeof setTimeout> | undefined
  /** The outage's grace (R43): it starts at the first end or miss, and a stream that opens ends it. */
  const grace: { timer: ReturnType<typeof setTimeout> | undefined; over: boolean } = { timer: undefined, over: false }
  const outage = () => {
    grace.timer ??= setTimeout(() => {
      grace.over = true
    }, reconnectGraceMs)
  }
  const endOutage = () => {
    clearTimeout(grace.timer)
    grace.timer = undefined
    grace.over = false
  }
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
        endOutage()
        for await (const frame of frames(res.body)) take(frame)
        outage()
      } catch (thrown) {
        // The watcher stopped (the page closed the stream; fetch rejects with an AbortError): end, with no report.
        if (closed() || (thrown instanceof DOMException && thrown.name === 'AbortError')) return
        // The network dropped: connect again after the retry time. Within the grace a miss is quiet, as the server
        // restarts; after it the status bar keeps the error. A long outage tells the page once, on its first error
        // shown, not once for each reconnect; the status bar says it, so it is not reported.
        outage()
        if (grace.over) {
          const first = lost === undefined
          const why = thrown instanceof Error ? thrown.message : String(thrown)
          lost = `Live updates lost the event stream (${why}); connecting again.`
          if (first) changed()
        }
      }
      await pause()
    }
  }
  void run()
  return () => {
    if (reload === invalidate) reload = undefined
    if (watchSignal === abort.signal) watchSignal = undefined
    watching -= 1
    // The owner left the page: a layout miss on his next visit is reported again.
    if (watching === 0) layoutOutage = false
    clearTimeout(timer)
    endOutage()
    abort.abort()
  }
}

/**
 * Whether the server lists the chat `chat` (a server chat ID), read now, past the cache: a link to a chat the cached
 * list does not name (d-118, useChatLink.ts) may name a chat made since. When it does, the cached list and every layout
 * are marked invalid, so the page's next load reads them. A read that misses answers false.
 */
export async function serverListsChat(
  chat: string,
  { client = queryClient, fetch = fetchWorkspaces }: Pick<LiveDeps, 'client' | 'fetch'> = {},
): Promise<boolean> {
  const answer = await fetch(AbortSignal.timeout(liveReadTimeoutMs))
  const listed = answer.ok && answer.value.workspaces.some((w) => w.chats.some((c) => c.id === chat))
  if (listed) await client.invalidateQueries({ queryKey, refetchType: 'none' })
  return listed
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
    let before = taken
    let mark = resumeMark()
    let answer = await fetch(AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
    // iOS closed the read with the page in the background: read again once the page shows, at once if it does.
    while (!answer.ok && noAnswer(answer.error) && quietMiss(queryKey, mark)) {
      await whenVisible(cancel)
      cancel.throwIfAborted()
      before = taken
      mark = resumeMark()
      answer = await fetch(AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
    }
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
  const live = liveOnly(state, workspaces, response.machine, herdr.layouts, herdr.tabs)
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
): Promise<{ layouts: Map<string, WorkspaceLayout>; tabs: Map<string, LiveTab[]>; missed: LiveMiss | undefined }> {
  const read =
    (id: WorkspaceId) =>
    async ({ signal: cancel }: { signal: AbortSignal }) => {
      let before = [taken, layoutsTaken.get(id) ?? 0]
      let mark = resumeMark()
      let answer = await fetch(id, AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
      // iOS closed the read with the page in the background: read again once the page shows, at once if it does.
      while (!answer.ok && noAnswer(answer.error) && quietMiss(layoutKey(id), mark)) {
        await whenVisible(cancel)
        cancel.throwIfAborted()
        before = [taken, layoutsTaken.get(id) ?? 0]
        mark = resumeMark()
        answer = await fetch(id, AbortSignal.any([cancel, AbortSignal.timeout(liveReadTimeoutMs)]))
      }
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
    response.workspaces.map(
      async (summary, at): Promise<[string, WorkspaceLayout, LiveTab[]] | LiveMiss | undefined> => {
        const workspace = workspaces[at]
        if (workspace === undefined) return undefined
        try {
          const layout = await client.query({
            queryKey: layoutKey(summary.id),
            queryFn: read(summary.id),
            staleTime: watching > 0 ? Infinity : 0,
            meta: expectedMiss,
          })
          return [workspace.id, layoutOfTab(layout.tabs), liveTabsOf(layout.tabs)]
        } catch (thrown) {
          if (thrown instanceof LiveMissError) return thrown.miss
          throw thrown
        }
      },
    ),
  )
  const layouts = new Map<string, WorkspaceLayout>()
  const tabs = new Map<string, LiveTab[]>()
  let missed: LiveMiss | undefined
  for (const pair of pairs) {
    if (Array.isArray(pair)) {
      layouts.set(pair[0], pair[1])
      tabs.set(pair[0], pair[2])
    } else missed ??= pair
  }
  return { layouts, tabs, missed }
}
