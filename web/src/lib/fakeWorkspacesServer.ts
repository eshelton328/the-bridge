// A fake of the server's workspace routes (W5), for tests: `GET
// /api/workspaces`, each workspace's layout (`GET
// /api/workspaces/:workspace/layout`, its chats side by side in one tab, the
// first focused unless `focus` moved it) and the event stream (`GET /api/events`), from one list.
// Every list, layout and event is checked against the contract
// (`WorkspacesResponse`, `WorkspaceLayout`, `WorkspacesChangedEvent`), so a
// test cannot send what the server would not. A test plugs `handle` into its
// `fetch` stub, after the transcript fake's.
//
// `replaceChat` is the list change of a /clear (backend #319): the chat gets a
// new ID on the same pane, the old ID's transcript streams end as the server
// ends them (`gone`, #313) and each open event stream gets
// `workspaces.changed`. A /clear from the terminal is that change alone; a
// /clear the transcript fake takes makes it too, with the ID `<chat>-c<n>`, as
// the server's fake agents name it. With `eventOnClear: false` that /clear
// changes the list with no event, as the server on herdr does today (the W5
// real run): the page must read the list again by itself.
//
// W2 (backend #333): each workspace's chats sit in herdr tabs (one tab of
// every chat, or `tabs` by workspace ID, the first tab active), and it takes
// the layout writes `POST /api/chats/:chat/focus`, `/zoom`, `/swap` and
// `/close`, each body checked against the contract, as the server does: a
// zoom of a tab's only pane is 409 singlePane, a swap with a chat of another
// tab 409 otherTab and with itself 400, a close whose confirm is not the
// chat 400, of a working or unknown chat 409 working and of a chat that
// needs the owner 409 needsYou; an unknown chat (or other chat) is 404. A
// write that goes through answers 204 and sends `layout.changed` (a close
// `workspaces.changed` too), unless `quietWrites` holds the events back.
// `answerWrites` answers every write with a test's error. `writes` records
// each one the page posted, with its body.
//
// W2c (backend #334): each tab keeps a split tree, its chats in a row at
// first. `POST /api/chats/:chat/split` puts a new shell chat (`<chat>-s<n>`)
// beside the chat (`row`) or below it (`column`), half and half, lists it and
// answers 201 with its ID; it sends `layout.changed` and `workspaces.changed`.
// `POST /api/workspaces/:workspace/layout/ratio` sets the ratio of the split
// at `path` of the tab (204, `layout.changed`), or answers 404 for a tab of
// another workspace or a path with no split.
//
// W2d (backend #337): each tab keeps its ID and label (`tab N`) for its life.
// `POST /api/chats/:chat/move` takes `{ tab, direction, beside? }`: the
// `beside` chat's pane of that tab, else its focused one, splits half and
// half and the moved pane takes the second part; a tab whose last pane moved
// out closes, and the first tab left is the active one. It answers 204 and
// sends `layout.changed` (and `workspaces.changed` when a tab closed). The
// chat's own tab is 409 sameTab, a zoomed tab 409 zoomedTab, and an unknown
// chat, a tab of another workspace or a `beside` chat of another tab 404.
// `zoomTab` zooms a tab as herdr would from the terminal.
//
// R43: `endEvents` ends each open event stream with no event, as a restart
// of the server does. R43b: `pingEvents` writes the server's ping comment
// to each open event stream (backend #424), and `hangEvents` forgets each
// open stream with no end, as a killed server behind the Vite proxy leaves it.
//
// W3 (backend #378 to #381): `POST /api/chats` takes the contract's
// `StartChatRequest`. It lists a new Claude chat (`<machine>/new<n>`, or its
// name's title) in a new tab of the workspace (a 404 for an unknown one), or
// beside the `beside` chat in its tab (`row` right, `column` below; a 404 for
// an unknown chat), with no focus change. It answers 201 with the pane, the
// chat and the state `startAs` sets: `ready` (the chat idle), `needsYou`, or
// `starting` (the chat `unknown`, no chat in the answer; `setStatus` makes it
// ready later), and sends `workspaces.changed` and `layout.changed`. A name a
// listed chat has is 409 nameTaken. A create ID it has answered gets the
// same answer with 200 and starts nothing. `answerNextStart` answers the
// next start with a test's error, after it starts the chat or not (`made`):
// the answer lost after herdr made it. Then the same create ID is 409
// duplicateCreate, as the server keeps it pending. `starts` records each
// body.
//
// W10 (backend #382, #384): `POST /api/chats/:chat/effort` takes the
// contract's `SetEffortRequest` (`max` and any other body are 400). An
// unknown chat is 404, a working one 409 working and one that needs the owner
// 409 needsYou; else the list gives the chat the set level, sends
// `workspaces.changed` and answers 204. `answerEffort` answers each next
// effort change with a test's error, and `efforts` records each body.
//
// W10 (backend #386, #391): `POST /api/chats/:chat/model` takes the
// contract's `RestartModelRequest`; a body it refuses, or a `confirm` that
// is not the chat, is 400. An unknown chat is 404, a working one 409 working,
// one that needs the owner 409 needsYou and one with that family already 409
// sameModel; else the list gives the chat the family as its model and its
// `modelId`, as the server does until the next turn, sends
// `workspaces.changed` and answers 200 `ready` with the same chat ID.
// `answerModel` answers each next restart with a test's answer, and `models`
// records each body.
//
// R41, R42 (backend #423): `POST /api/workspaces/:workspace/rename` and
// `POST /api/chats/:chat/rename` take the contract's `{ name }` (a name the
// contract's `Label` refuses is 400); the list gives the workspace that
// label, or the chat that title (herdr's pane label, which the server lists
// first), sends `workspaces.changed` and answers 204, and an unknown one is
// 404. `POST /api/workspaces/order` takes `WorkspaceOrderRequest` (a repeat
// is 400): an order that leaves out a listed workspace or names another is
// 409 workspace-not-ready orderStale; else the list takes that order, sends
// `workspaces.changed` and answers 204. `answerEdits` answers each next edit
// with a test's error, `edits` records each body, and `putWorkspace` lists
// another workspace, with no event when `quiet`, as herdr makes one.
// Backend #427: `POST /api/workspaces/:workspace/close` takes
// `CloseWorkspaceRequest`; a `confirm` of another workspace is 400, an
// unknown one 404, and a `panes` that is not its number of chats 409
// workspace-not-ready panesChanged; else the workspace leaves the list,
// which sends `workspaces.changed`, and the answer is 204. `answerEdits`
// gives the other 409 states. Backend #435: `POST /api/chats/:chat/workspace`
// takes `MoveToWorkspaceRequest`; an unknown chat or workspace is 404 and its
// own workspace 409 chat-not-ready sameWorkspace; else the chat (same ID)
// goes last in that workspace, its old workspace leaves when it is empty,
// which sends `workspaces.changed`, and the answer is 200 with the contract's
// `MoveToWorkspaceResponse`. `answerEdits` gives the other 409 states.
import {
  ChatId,
  type ChatSummary,
  CloseChatRequest,
  CloseWorkspaceRequest,
  type ErrorBody,
  FocusChatRequest,
  MoveToWorkspaceRequest,
  MoveToWorkspaceResponse,
  chatsOf,
  LayoutChangedEvent,
  type LayoutNode,
  type ModelAlias,
  MoveChatRequest,
  RenameChatRequest,
  RenameWorkspaceRequest,
  RestartModelRequest,
  SetEffortRequest,
  SetSplitRatioRequest,
  StartChatRequest,
  type StartState,
  SplitChatRequest,
  SwapChatsRequest,
  WorkspaceLayout,
  WorkspaceOrderRequest,
  WorkspacesChangedEvent,
  WorkspacesResponse,
  ZoomChatRequest,
} from '@bridge/contract'
import { errorAnswer, type FakeTranscriptServer } from './fakeTranscriptServer.ts'

/** A layout write the fake takes. */
type Write = 'focus' | 'zoom' | 'swap' | 'close' | 'split' | 'ratio' | 'move'

/**
 * One herdr tab of a workspace: its ID and label, its split tree (none with no pane: the tab closed), the focused chat,
 * and whether it is zoomed.
 */
type Tab = { id: string; label: string; root: LayoutNode | undefined; focused: string | undefined; zoomed: boolean }

const leaf = (chat: ChatId): LayoutNode => ({ kind: 'pane', chat })

/** `chats` side by side, each split at half: `row(row(a, b), c)`. */
const rowOf = (chats: readonly ChatId[]): LayoutNode | undefined =>
  chats.reduce<LayoutNode | undefined>(
    (left, c) =>
      left === undefined ? leaf(c) : { kind: 'split', direction: 'row', ratio: 0.5, first: left, second: leaf(c) },
    undefined,
  )

/** `node` with each pane's chat put through `change`: a pane whose chat it drops leaves, and its split with it. */
function mapPanes(node: LayoutNode, change: (chat: ChatId) => LayoutNode | undefined): LayoutNode | undefined {
  if (node.kind === 'pane') return change(node.chat)
  const first = mapPanes(node.first, change)
  const second = mapPanes(node.second, change)
  if (first === undefined) return second
  if (second === undefined) return first
  return { ...node, first, second }
}

const chatsIn = (tab: Tab): ChatId[] => (tab.root === undefined ? [] : chatsOf(tab.root))

const writeSchemas = {
  focus: FocusChatRequest,
  zoom: ZoomChatRequest,
  swap: SwapChatsRequest,
  close: CloseChatRequest,
  split: SplitChatRequest,
  move: MoveChatRequest,
} as const

const bodyOf = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

const notReady = (state: Extract<ErrorBody['error'], { kind: 'chat-not-ready' }>['state']) =>
  errorAnswer({ kind: 'chat-not-ready', state, message: 'Not ready', requestId: 'r-409' }, 409)

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

export type FakeWorkspacesOptions = {
  readonly eventOnClear?: boolean
  /** The tabs of a workspace, by its ID: each tab's chats in tree order, the first tab active. One tab when not set. */
  readonly tabs?: Readonly<Record<string, readonly (readonly string[])[]>>
  /** The split tree of each tab of a workspace, by its ID, in place of `tabs`' rows. */
  readonly roots?: Readonly<Record<string, readonly LayoutNode[]>>
}

export function fakeWorkspacesServer(
  transcripts: FakeTranscriptServer,
  list: unknown,
  { eventOnClear = true, tabs: firstTabs = {}, roots = {} }: FakeWorkspacesOptions = {},
) {
  const encoder = new TextEncoder()
  let response = WorkspacesResponse.parse(list)
  const streams: ReadableStreamDefaultController<Uint8Array>[] = []
  let seq = 0
  let clears = 0
  let splits = 0
  /** Each workspace's tabs, by its ID, made from the list on first use. */
  const tabsBy = new Map<string, Tab[]>()
  /** Each layout write the page posted, with its chat (as the server read it) and its body. */
  const writes: { chat: string; action: Write; body: unknown }[] = []
  /** The writes send no event while set: the page must read the layout again by itself. */
  let quietWrites = false
  /** An answer in place of every write's, while set. */
  let writeAnswer: (() => Response) | undefined
  /** W3: each start's body, the state the next starts answer, each create ID's answer, and the next start's own answer. */
  const starts: unknown[] = []
  let startState: StartState = 'ready'
  let started = 0
  const created = new Map<string, unknown>()
  let nextStart: { readonly answer: () => Response; readonly made: boolean } | undefined
  /** W10: each effort change's chat and body, and an answer in place of the next ones'. */
  const efforts: { chat: string; body: unknown }[] = []
  let effortAnswer: (() => Response) | undefined
  /** W10: each model restart's chat and body, and an answer in place of the next ones'. */
  const models: { chat: string; body: unknown }[] = []
  let modelAnswer: (() => Response) | undefined
  /** R41, R42: each edit's action, its target (none for an order) and its body, and an answer in place of the next ones'. */
  const edits: {
    action: 'renameWorkspace' | 'renameChat' | 'order' | 'close' | 'moveChat'
    target?: string
    body: unknown
  }[] = []
  let editAnswer: (() => Response) | undefined

  /** The ID of the tab made `at`th for `workspace`; it stays while the tab lives. */
  const tabId = (workspace: string, at: number) => `${workspace}:t${String(at + 1)}`

  /** The tabs of `workspace` now: its chats that left the list leave them, and a new chat joins the first. */
  const tabsOf = (workspace: string): Tab[] => {
    const listed = (response.workspaces.find((w) => w.id === workspace)?.chats ?? []).map((c) => c.id)
    const named = (at: number) => ({ id: tabId(workspace, at), label: `tab ${String(at + 1)}` })
    const tabs =
      tabsBy.get(workspace) ??
      roots[workspace]?.map((root, at) => ({ ...named(at), root, focused: undefined, zoomed: false })) ??
      (firstTabs[workspace] ?? [listed]).map((chats, at) => ({
        ...named(at),
        root: rowOf(chats.map((c) => ChatId.parse(c))),
        focused: undefined,
        zoomed: false,
      }))
    for (const tab of tabs) tab.root = tab.root && mapPanes(tab.root, (c) => (listed.includes(c) ? leaf(c) : undefined))
    const first = tabs.find((t) => t.root !== undefined) ?? tabs[0]
    if (first !== undefined)
      for (const c of listed)
        if (!tabs.some((t) => chatsIn(t).includes(c)))
          first.root =
            first.root === undefined
              ? leaf(c)
              : { kind: 'split', direction: 'row', ratio: 0.5, first: first.root, second: leaf(c) }
    tabsBy.set(workspace, tabs)
    return tabs
  }

  const layoutOf = (workspace: string) => {
    const summaries = response.workspaces.find((w) => w.id === workspace)?.chats ?? []
    const tabs = tabsOf(workspace).filter((t) => t.root !== undefined)
    if (tabs.length === 0) return undefined
    return WorkspaceLayout.parse({
      workspace,
      tabs: tabs.map((tab, at) => {
        const { root } = tab
        if (root === undefined) throw new Error('a tab with no pane')
        const chats = chatsOf(root)
        const focusedChat = chats.find((c) => c === tab.focused) ?? chats[0]
        return {
          id: tab.id,
          label: tab.label,
          active: at === 0,
          root,
          focusedChat,
          zoomed: tab.zoomed,
          chats: chats.map((c) => summaries.find((s) => s.id === c)),
        }
      }),
    })
  }

  const events = (signal: AbortSignal | null | undefined) => {
    let control: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        control = c
        c.enqueue(encoder.encode('event: open\nretry: 200\ndata: {}\n\n'))
      },
      cancel: () => {
        const at = streams.findIndex((s) => s === control)
        if (at !== -1) streams.splice(at, 1)
      },
    })
    if (control !== undefined) streams.push(control)
    signal?.addEventListener('abort', () => {
      const at = streams.findIndex((s) => s === control)
      if (at === -1) return
      streams.splice(at, 1)
      control?.close()
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  /** Sends `workspaces.changed` to each open event stream: the page reads the list again. */
  const changed = () => {
    const event = WorkspacesChangedEvent.parse({
      source: `${response.machine}/herdr`,
      seq: seq++,
      type: 'workspaces.changed',
      data: {},
    })
    const text = `event: workspaces.changed\nid: ${String(event.seq)}\ndata: ${JSON.stringify(event)}\n\n`
    for (const s of streams) s.enqueue(encoder.encode(text))
  }

  /** Sends `layout.changed` for `workspace` to each open event stream. */
  const layoutChanged = (workspace: string) => {
    const event = LayoutChangedEvent.parse({
      source: `${response.machine}/herdr`,
      seq: seq++,
      type: 'layout.changed',
      data: { workspace },
    })
    const text = `event: layout.changed\nid: ${String(event.seq)}\ndata: ${JSON.stringify(event)}\n\n`
    for (const s of streams) s.enqueue(encoder.encode(text))
  }

  /** The workspace and tab that hold `chat`, or none. */
  const placeOf = (chat: string) => {
    for (const w of response.workspaces) {
      const tab = tabsOf(w.id).find((t) => chatsIn(t).some((c) => c === chat))
      if (tab !== undefined) return { workspace: w.id, tab }
    }
    return undefined
  }

  /** Focuses `chat` in its workspace's layout and sends `layout.changed`, as herdr's focus change from the terminal. */
  const focus = (chat: string) => {
    const place = placeOf(chat)
    if (place === undefined) return
    place.tab.focused = chat
    layoutChanged(place.workspace)
  }

  /** A layout write: the contract's checks, the test's answer, then herdr's rules, 204 and the events. */
  const write = (chat: string, action: Exclude<Write, 'ratio'>, init: RequestInit | undefined): Response => {
    const body = bodyOf(init)
    writes.push({ chat, action, body })
    const json = new Headers(init?.headers).get('content-type') === 'application/json'
    const parsed = writeSchemas[action].safeParse(body)
    const invalid = () =>
      errorAnswer({ kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' }, 400)
    if (!json || !parsed.success) return invalid()
    if (writeAnswer !== undefined) return writeAnswer()
    const gone = () =>
      errorAnswer({ kind: 'not-found', path: `/api/chats/${chat}`, message: 'Not found', requestId: 'r-404' }, 404)
    const place = placeOf(chat)
    if (place === undefined) return gone()
    const { tab, workspace } = place
    const summary = response.workspaces.flatMap((w) => w.chats).find((c) => c.id === chat)
    let closed = false
    if (action === 'focus') tab.focused = chat
    if (action === 'zoom') {
      const { zoomed } = ZoomChatRequest.parse(body)
      if (chatsIn(tab).length < 2) return notReady('singlePane')
      tab.zoomed = zoomed
      if (zoomed) tab.focused = chat
    }
    if (action === 'swap') {
      const other = SwapChatsRequest.parse(body).with
      if (other === chat) return invalid()
      const there = placeOf(other)
      if (there === undefined) return gone()
      if (there.tab !== tab) return notReady('otherTab')
      tab.root =
        tab.root &&
        mapPanes(tab.root, (c) => leaf(c === chat ? ChatId.parse(other) : c === other ? ChatId.parse(chat) : c))
    }
    let split = false
    let created: string | undefined
    if (action === 'split') {
      const { direction } = SplitChatRequest.parse(body)
      splits += 1
      const shell = ChatId.parse(`${chat}-s${String(splits)}`)
      response = WorkspacesResponse.parse({
        ...response,
        workspaces: response.workspaces.map((w) =>
          w.id === workspace
            ? {
                ...w,
                chats: [
                  ...w.chats,
                  {
                    ...(summary ?? {}),
                    id: shell,
                    kind: 'shell',
                    title: 'zsh',
                    model: 'zsh',
                    status: 'idle',
                    pane: `${shell}-pane`,
                    parent: null,
                  },
                ],
              }
            : w,
        ),
      })
      tab.root =
        tab.root &&
        mapPanes(tab.root, (c) =>
          c === chat ? { kind: 'split', direction, ratio: 0.5, first: leaf(c), second: leaf(shell) } : leaf(c),
        )
      split = true
      created = shell
    }
    if (action === 'close') {
      if (CloseChatRequest.parse(body).confirm !== chat) return invalid()
      if (summary?.status === 'working' || summary?.status === 'unknown') return notReady('working')
      if (summary?.status === 'needsYou') return notReady('needsYou')
      response = WorkspacesResponse.parse({
        ...response,
        workspaces: response.workspaces.map((w) => ({ ...w, chats: w.chats.filter((c) => c.id !== chat) })),
      })
      tab.root = tab.root && mapPanes(tab.root, (c) => (c === chat ? undefined : leaf(c)))
      if (tab.focused === chat) tab.focused = undefined
      if (chatsIn(tab).length < 2) tab.zoomed = false
      transcripts.gone(chat)
      closed = true
    }
    if (action === 'move') {
      const { tab: to, direction, beside } = MoveChatRequest.parse(body)
      const target = tabsOf(workspace).find((t) => t.id === to && t.root !== undefined)
      if (target === undefined) return gone()
      if (target === tab) return notReady('sameTab')
      if (target.zoomed) return notReady('zoomedTab')
      const targetChats = chatsIn(target)
      if (beside !== undefined && !targetChats.includes(beside)) return gone()
      const at = beside ?? targetChats.find((c) => c === target.focused) ?? targetChats[0]
      tab.root = tab.root && mapPanes(tab.root, (c) => (c === chat ? undefined : leaf(c)))
      if (tab.focused === chat) tab.focused = undefined
      target.root =
        target.root &&
        mapPanes(target.root, (c) =>
          c === at
            ? { kind: 'split', direction, ratio: 0.5, first: leaf(c), second: leaf(ChatId.parse(chat)) }
            : leaf(c),
        )
      // A tab whose last pane moved out closes (herdr), and the workspace's list changes.
      closed = tab.root === undefined
    }
    if (!quietWrites) {
      layoutChanged(workspace)
      if (closed || split) changed()
    }
    if (created !== undefined)
      return new Response(JSON.stringify({ chat: created }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    return new Response(null, { status: 204 })
  }

  /** A ratio write: the contract's checks, the test's answer, then the split at its path, 204 and the event. */
  const ratio = (workspace: string, init: RequestInit | undefined): Response => {
    const body = bodyOf(init)
    writes.push({ chat: workspace, action: 'ratio', body })
    const parsed = SetSplitRatioRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    if (writeAnswer !== undefined) return writeAnswer()
    const gone = () =>
      errorAnswer(
        { kind: 'not-found', path: `/api/workspaces/${workspace}`, message: 'Not found', requestId: 'r-404' },
        404,
      )
    const tabs = tabsOf(workspace).filter((t) => t.root !== undefined)
    const tab = tabs.find((t) => t.id === parsed.data.tab)
    if (tab?.root === undefined) return gone()
    const set = (node: LayoutNode, path: readonly ('first' | 'second')[]): LayoutNode | undefined => {
      if (node.kind === 'pane') return undefined
      const [side, ...rest] = path
      if (side === undefined) return { ...node, ratio: parsed.data.ratio }
      const part = set(node[side], rest)
      return part === undefined ? undefined : { ...node, [side]: part }
    }
    const root = set(tab.root, parsed.data.path)
    if (root === undefined) return gone()
    tab.root = root
    if (!quietWrites) layoutChanged(workspace)
    return new Response(null, { status: 204 })
  }

  /** A start (W3): the contract's checks, the create ID, the place, the new chat listed, then 201 and the events. */
  const start = (init: RequestInit | undefined): Response => {
    const body = bodyOf(init)
    starts.push(body)
    const parsed = StartChatRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    const { name, place, createId } = parsed.data
    const kept = createId === undefined ? undefined : created.get(createId)
    if (kept === 'pending') return notReady('duplicateCreate')
    if (kept !== undefined) return json(kept)
    const gone = () =>
      errorAnswer({ kind: 'not-found', path: '/api/chats', message: 'Not found', requestId: 'r-404' }, 404)
    const beside = place.in === 'split' ? placeOf(place.beside) : undefined
    const workspace = place.in === 'split' ? beside?.workspace : place.workspace
    if (workspace === undefined || !response.workspaces.some((w) => w.id === workspace)) return gone()
    const listed = response.workspaces.flatMap((w) => w.chats)
    if (name !== undefined && listed.some((c) => c.title === name)) return notReady('nameTaken')
    const answer = nextStart
    nextStart = undefined
    if (answer !== undefined && !answer.made) return answer.answer()
    started += 1
    const chat = ChatId.parse(`${response.machine}/new${String(started)}`)
    const state = startState
    const pane = `${chat}-pane`
    const at = tabsOf(workspace)
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: response.workspaces.map((w) =>
        w.id === workspace
          ? {
              ...w,
              chats: [
                ...w.chats,
                {
                  id: chat,
                  kind: 'claude',
                  title: name ?? `chat-${String(started)}`,
                  model: 'claude-opus-5-5',
                  modelId: 'opus',
                  effort: null,
                  contextUsed: null,
                  status: state === 'ready' ? 'idle' : state === 'needsYou' ? 'needsYou' : 'unknown',
                  parent: null,
                  pane,
                },
              ],
            }
          : w,
      ),
    })
    transcripts.set(chat, [])
    if (place.in === 'split' && beside !== undefined)
      beside.tab.root =
        beside.tab.root &&
        mapPanes(beside.tab.root, (c) =>
          c === place.beside
            ? { kind: 'split', direction: place.direction, ratio: 0.5, first: leaf(c), second: leaf(chat) }
            : leaf(c),
        )
    else
      at.push({
        id: tabId(workspace, at.length),
        label: `tab ${String(at.length + 1)}`,
        root: leaf(chat),
        focused: undefined,
        zoomed: false,
      })
    const reply = { pane, ...(state === 'starting' ? {} : { chat }), state }
    if (createId !== undefined) created.set(createId, answer === undefined ? reply : 'pending')
    changed()
    layoutChanged(workspace)
    if (answer !== undefined) return answer.answer()
    return new Response(JSON.stringify(reply), { status: 201, headers: { 'content-type': 'application/json' } })
  }

  /** An effort change (W10): the contract's checks, the test's answer, then the chat's status, the list, 204. */
  const effort = (chat: string, init: RequestInit | undefined): Response => {
    const body = bodyOf(init)
    efforts.push({ chat, body })
    const parsed = SetEffortRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    if (effortAnswer !== undefined) return effortAnswer()
    const summary = response.workspaces.flatMap((w) => w.chats).find((c) => c.id === chat)
    if (summary === undefined)
      return errorAnswer(
        { kind: 'not-found', path: `/api/chats/${chat}`, message: 'Not found', requestId: 'r-404' },
        404,
      )
    if (summary.status === 'working') return notReady('working')
    if (summary.status === 'needsYou') return notReady('needsYou')
    update((c) => (c.id === chat ? { ...c, effort: parsed.data.effort } : c))
    return new Response(null, { status: 204 })
  }

  /** A model restart (W10): the contract's checks, the test's answer, then the chat's status and model, the list, 200. */
  const model = (chat: string, init: RequestInit | undefined): Response => {
    const body = bodyOf(init)
    models.push({ chat, body })
    const parsed = RestartModelRequest.safeParse(body)
    if (
      new Headers(init?.headers).get('content-type') !== 'application/json' ||
      !parsed.success ||
      parsed.data.confirm !== chat
    )
      return errorAnswer(
        { kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' },
        400,
      )
    if (modelAnswer !== undefined) return modelAnswer()
    const summary = response.workspaces.flatMap((w) => w.chats).find((c) => c.id === chat)
    if (summary === undefined)
      return errorAnswer(
        { kind: 'not-found', path: `/api/chats/${chat}`, message: 'Not found', requestId: 'r-404' },
        404,
      )
    if (summary.status === 'working') return notReady('working')
    if (summary.status === 'needsYou') return notReady('needsYou')
    if (summary.modelId === parsed.data.model) return notReady('sameModel')
    update((c) => (c.id === chat ? { ...c, model: parsed.data.model, modelId: parsed.data.model } : c))
    return new Response(JSON.stringify({ state: 'ready', chat }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const badBody = () =>
    errorAnswer(
      {
        kind: 'invalid-input',
        issues: ['the body'],
        message: 'the request does not match the contract',
        requestId: 'r-400',
      },
      400,
    )

  /** A rename (R41, R42): the contract's checks, the test's answer, then the label or the title, the event and 204. */
  const rename = (action: 'renameWorkspace' | 'renameChat', target: string, init: RequestInit | undefined) => {
    const body = bodyOf(init)
    edits.push({ action, target, body })
    const parsed = (action === 'renameWorkspace' ? RenameWorkspaceRequest : RenameChatRequest).safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return badBody()
    if (editAnswer !== undefined) return editAnswer()
    const { name } = parsed.data
    const known =
      action === 'renameWorkspace'
        ? response.workspaces.some((w) => w.id === target)
        : response.workspaces.some((w) => w.chats.some((c) => c.id === target))
    if (!known)
      return errorAnswer({ kind: 'not-found', path: `/api/${target}`, message: 'Not found', requestId: 'r-404' }, 404)
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: response.workspaces.map((w) =>
        action === 'renameWorkspace'
          ? w.id === target
            ? { ...w, label: name }
            : w
          : { ...w, chats: w.chats.map((c) => (c.id === target ? { ...c, title: name } : c)) },
      ),
    })
    changed()
    return new Response(null, { status: 204 })
  }

  /** An order of the workspaces (R41): the contract's checks, the test's answer, a stale order, then the list's order. */
  const order = (init: RequestInit | undefined) => {
    const body = bodyOf(init)
    edits.push({ action: 'order', body })
    const parsed = WorkspaceOrderRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return badBody()
    if (editAnswer !== undefined) return editAnswer()
    const ids = parsed.data.workspaces
    const listed = response.workspaces.map((w) => w.id)
    if (ids.length !== listed.length || !listed.every((id) => ids.includes(id)))
      return errorAnswer(
        {
          kind: 'workspace-not-ready',
          state: 'orderStale',
          message: 'the order does not name each workspace of the list once',
          requestId: 'r-409',
        },
        409,
      )
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: ids.flatMap((id) => response.workspaces.filter((w) => w.id === id)),
    })
    changed()
    return new Response(null, { status: 204 })
  }

  /** A close of a workspace (backend #427): the contract's checks, the test's answer, the confirm, the count, then 204. */
  const close = (target: string, init: RequestInit | undefined) => {
    const body = bodyOf(init)
    edits.push({ action: 'close', target, body })
    const parsed = CloseWorkspaceRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return badBody()
    if (editAnswer !== undefined) return editAnswer()
    if (parsed.data.confirm !== target)
      return errorAnswer(
        {
          kind: 'invalid-input',
          issues: ['confirm'],
          message: 'the confirm does not name this workspace',
          requestId: 'r-400',
        },
        400,
      )
    const found = response.workspaces.find((w) => w.id === target)
    if (found === undefined)
      return errorAnswer({ kind: 'not-found', path: `/api/${target}`, message: 'Not found', requestId: 'r-404' }, 404)
    if (found.chats.length !== parsed.data.panes)
      return errorAnswer(
        {
          kind: 'workspace-not-ready',
          state: 'panesChanged',
          message: 'the workspace has another number of chats',
          requestId: 'r-409',
        },
        409,
      )
    response = WorkspacesResponse.parse({ ...response, workspaces: response.workspaces.filter((w) => w !== found) })
    changed()
    return new Response(null, { status: 204 })
  }

  /** A move of a chat to another workspace (backend #435): the contract's checks, the test's answer, then 200. */
  const moveChat = (target: string, init: RequestInit | undefined) => {
    const body = bodyOf(init)
    edits.push({ action: 'moveChat', target, body })
    const parsed = MoveToWorkspaceRequest.safeParse(body)
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return badBody()
    if (editAnswer !== undefined) return editAnswer()
    const from = response.workspaces.find((w) => w.chats.some((c) => c.id === target))
    const moved = from?.chats.find((c) => c.id === target)
    const to = response.workspaces.find((w) => w.id === parsed.data.workspace)
    if (from === undefined || moved === undefined || to === undefined)
      return errorAnswer({ kind: 'not-found', path: `/api/${target}`, message: 'Not found', requestId: 'r-404' }, 404)
    if (from === to)
      return errorAnswer(
        {
          kind: 'chat-not-ready',
          state: 'sameWorkspace',
          message: 'the chat is in that workspace',
          requestId: 'r-409',
        },
        409,
      )
    const sourceClosed = from.chats.length === 1
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: response.workspaces.flatMap((w) =>
        w === from
          ? sourceClosed
            ? []
            : [{ ...w, chats: w.chats.filter((c) => c !== moved) }]
          : w === to
            ? [{ ...w, chats: [...w.chats, moved] }]
            : [w],
      ),
    })
    changed()
    return json(
      MoveToWorkspaceResponse.parse({ chat: target, pane: { from: moved.pane, to: moved.pane }, sourceClosed }),
    )
  }

  /** Changes the list with `change`, checked against the contract, and tells the event streams unless `quiet`. */
  const update = (change: (chat: ChatSummary) => ChatSummary, quiet = false) => {
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: response.workspaces.map((w) => ({ ...w, chats: w.chats.map(change) })),
    })
    if (!quiet) changed()
  }

  /** The list change of a /clear: `chat` leaves the list and `next` takes its place, on the same pane. */
  const replaceChat = (chat: string, next: string, quiet = false) => {
    const id = ChatId.parse(next)
    // The new ID keeps the pane's place in its tab.
    for (const tabs of tabsBy.values())
      for (const tab of tabs) {
        tab.root = tab.root && mapPanes(tab.root, (c) => leaf(c === chat ? id : c))
        if (tab.focused === chat) tab.focused = id
      }
    update((c) => (c.id === chat ? { ...c, id } : c), quiet)
    transcripts.gone(chat)
  }

  transcripts.onClear((chat) => {
    clears += 1
    replaceChat(chat, `${chat}-c${String(clears)}`, !eventOnClear)
  })

  return {
    replaceChat,
    focus,
    /** Each layout write the page posted, in order. */
    writes,
    /** The tabs of `workspace` now, as the layout read gives them. */
    tabs: (workspace: string) => tabsOf(workspace).map((t) => ({ ...t, chats: chatsIn(t) })),
    /** Holds back the events of each write while `quiet` is set. */
    quietWrites: (quiet: boolean) => {
      quietWrites = quiet
    },
    /** Answers every write with `answer` until it is set to undefined. */
    answerWrites: (answer: (() => Response) | undefined) => {
      writeAnswer = answer
    },
    /** Zooms the tab `tab` (its ID) of `workspace`, as herdr's zoom from the terminal, and sends `layout.changed`. */
    zoomTab: (workspace: string, tab: string) => {
      const found = tabsOf(workspace).find((t) => t.id === tab)
      if (found === undefined) return
      found.zoomed = true
      layoutChanged(workspace)
    },
    /** Sends `layout.changed` for `workspace`, as herdr's own change of a layout. */
    layoutChanged,
    /** Sends `workspaces.changed`, as herdr's own change of the list. */
    listChanged: changed,
    /** Ends each open event stream with no event, as a restart of the server does (review R43). */
    endEvents: () => {
      for (const s of streams.splice(0)) s.close()
    },
    /** Writes the server's ping comment to each open event stream (backend #424). */
    pingEvents: () => {
      for (const s of streams) s.enqueue(encoder.encode(': ping\n\n'))
    },
    /** Forgets each open event stream with no end, as a killed server behind the Vite proxy leaves it (R43b). */
    hangEvents: () => {
      streams.splice(0)
    },
    /** Sets the status of `chat`, as a `workspaces.changed` read again shows it. */
    setStatus: (chat: string, status: ChatSummary['status']) => {
      update((c) => (c.id === chat ? { ...c, status } : c))
    },
    /** Each start's body (W3), in order. */
    starts,
    /** The state each next start answers (W3): `ready` unless set. */
    startAs: (state: StartState) => {
      startState = state
    },
    /** Answers the next start with `answer`, after it starts the chat when `made` (an answer lost after herdr made it). */
    answerNextStart: (answer: () => Response, made = false) => {
      nextStart = { answer, made }
    },
    /** Each effort change the page posted (W10), with its chat as the server read it. */
    efforts,
    /** Answers each next effort change with `answer` until it is set to undefined. */
    answerEffort: (answer: (() => Response) | undefined) => {
      effortAnswer = answer
    },
    /** Puts `next` in the list in place of `chat`, as herdr lists another occupant of its pane (W10: a shell). */
    putOnPane: (chat: string, next: ChatSummary) => {
      update((c) => (c.id === chat ? next : c))
    },
    /** Lists `model` for `chat`, as the server does once a restart started the new chat (W10), and tells the streams. */
    setModel: (chat: string, model: ModelAlias) => {
      update((c) => (c.id === chat ? { ...c, model, modelId: model } : c))
    },
    /** Each model restart the page posted (W10), with its chat as the server read it. */
    models,
    /** Answers each next model restart with `answer` until it is set to undefined. */
    answerModel: (answer: (() => Response) | undefined) => {
      modelAnswer = answer
    },
    /** The chats of the list now. */
    chats: () => response.workspaces.flatMap((w) => w.chats),
    /** The workspaces of the list now, in its order: their IDs and labels. */
    workspaces: () => response.workspaces.map((w) => ({ id: w.id, label: w.label })),
    /** Each rename, order, close and move the page posted (R41, R42, backend #427, #435), in order. */
    edits,
    /** Answers each next rename, order, close and move with `answer` until it is set to undefined. */
    answerEdits: (answer: (() => Response) | undefined) => {
      editAnswer = answer
    },
    /** Adds `chat` to the end of `workspace` (checked against the contract), and tells the streams unless `quiet`. */
    putChat: (workspace: string, chat: unknown, quiet = false) => {
      response = WorkspacesResponse.parse({
        ...response,
        workspaces: response.workspaces.map((w) => (w.id === workspace ? { ...w, chats: [...w.chats, chat] } : w)),
      })
      if (!quiet) changed()
    },
    /** Lists `workspace` last, as herdr makes one (checked against the contract), and tells the streams unless `quiet`. */
    putWorkspace: (workspace: unknown, quiet = false) => {
      response = WorkspacesResponse.parse({ ...response, workspaces: [...response.workspaces, workspace] })
      if (!quiet) changed()
    },
    /** The answer to a request for `path`, or undefined when it is not a workspace route. */
    handle: (path: string, init?: RequestInit): Response | undefined => {
      if (path === '/api/workspaces') return json(response)
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout !== null) {
        const body = layoutOf(decodeURIComponent(layout[1] ?? ''))
        return body === undefined ? undefined : json(body)
      }
      if (path === '/api/events') return events(init?.signal)
      if (path === '/api/chats' && init?.method === 'POST') return start(init)
      if (path === '/api/workspaces/order' && init?.method === 'POST') return order(init)
      const closePath = /^\/api\/workspaces\/([^/]+)\/close$/.exec(path)
      if (closePath !== null && init?.method === 'POST') return close(decodeURIComponent(closePath[1] ?? ''), init)
      const movePath = /^\/api\/chats\/([^/]+)\/workspace$/.exec(path)
      if (movePath !== null && init?.method === 'POST') return moveChat(decodeURIComponent(movePath[1] ?? ''), init)
      const renamed = /^\/api\/(workspaces|chats)\/([^/]+)\/rename$/.exec(path)
      if (renamed !== null && init?.method === 'POST')
        return rename(
          renamed[1] === 'workspaces' ? 'renameWorkspace' : 'renameChat',
          decodeURIComponent(renamed[2] ?? ''),
          init,
        )
      const effortPath = /^\/api\/chats\/([^/]+)\/effort$/.exec(path)
      if (effortPath !== null && init?.method === 'POST') return effort(decodeURIComponent(effortPath[1] ?? ''), init)
      const modelPath = /^\/api\/chats\/([^/]+)\/model$/.exec(path)
      if (modelPath !== null && init?.method === 'POST') return model(decodeURIComponent(modelPath[1] ?? ''), init)
      const ratioPath = /^\/api\/workspaces\/([^/]+)\/layout\/ratio$/.exec(path)
      if (ratioPath !== null && init?.method === 'POST') return ratio(decodeURIComponent(ratioPath[1] ?? ''), init)
      const posted = /^\/api\/chats\/([^/]+)\/(focus|zoom|swap|close|split|move)$/.exec(path)
      if (posted !== null && init?.method === 'POST') {
        const action = posted[2]
        if (
          action === 'focus' ||
          action === 'zoom' ||
          action === 'swap' ||
          action === 'close' ||
          action === 'split' ||
          action === 'move'
        )
          return write(decodeURIComponent(posted[1] ?? ''), action, init)
      }
      return undefined
    },
  }
}

export type FakeWorkspacesServer = ReturnType<typeof fakeWorkspacesServer>
