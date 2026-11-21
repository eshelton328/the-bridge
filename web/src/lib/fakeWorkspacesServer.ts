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
import {
  ChatId,
  type ChatSummary,
  CloseChatRequest,
  type ErrorBody,
  FocusChatRequest,
  chatsOf,
  LayoutChangedEvent,
  type LayoutNode,
  SetSplitRatioRequest,
  SplitChatRequest,
  SwapChatsRequest,
  WorkspaceLayout,
  WorkspacesChangedEvent,
  WorkspacesResponse,
  ZoomChatRequest,
} from '@bridge/contract'
import { errorAnswer, type FakeTranscriptServer } from './fakeTranscriptServer.ts'

/** A layout write the fake takes. */
type Write = 'focus' | 'zoom' | 'swap' | 'close' | 'split' | 'ratio'

/** One herdr tab of a workspace: its split tree (none with no pane), the focused chat, and whether it is zoomed. */
type Tab = { root: LayoutNode | undefined; focused: string | undefined; zoomed: boolean }

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

  /** The tabs of `workspace` now: its chats that left the list leave them, and a new chat joins the first. */
  const tabsOf = (workspace: string): Tab[] => {
    const listed = (response.workspaces.find((w) => w.id === workspace)?.chats ?? []).map((c) => c.id)
    const tabs =
      tabsBy.get(workspace) ??
      roots[workspace]?.map((root) => ({ root, focused: undefined, zoomed: false })) ??
      (firstTabs[workspace] ?? [listed]).map((chats) => ({
        root: rowOf(chats.map((c) => ChatId.parse(c))),
        focused: undefined,
        zoomed: false,
      }))
    for (const tab of tabs) tab.root = tab.root && mapPanes(tab.root, (c) => (listed.includes(c) ? leaf(c) : undefined))
    const first = tabs[0]
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

  /** The ID of the tab at `at` of `workspace`, counting only the tabs with a pane. */
  const tabId = (workspace: string, at: number) => `${workspace}:t${String(at + 1)}`

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
          id: tabId(workspace, at),
          label: `tab ${String(at + 1)}`,
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
    const tab = tabs.find((_, at) => tabId(workspace, at) === parsed.data.tab)
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
    /** Sends `layout.changed` for `workspace`, as herdr's own change of a layout. */
    layoutChanged,
    /** Sends `workspaces.changed`, as herdr's own change of the list. */
    listChanged: changed,
    /** Sets the status of `chat`, as a `workspaces.changed` read again shows it. */
    setStatus: (chat: string, status: ChatSummary['status']) => {
      update((c) => (c.id === chat ? { ...c, status } : c))
    },
    /** The chats of the list now. */
    chats: () => response.workspaces.flatMap((w) => w.chats),
    /** The answer to a request for `path`, or undefined when it is not a workspace route. */
    handle: (path: string, init?: RequestInit): Response | undefined => {
      if (path === '/api/workspaces') return json(response)
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout !== null) {
        const body = layoutOf(decodeURIComponent(layout[1] ?? ''))
        return body === undefined ? undefined : json(body)
      }
      if (path === '/api/events') return events(init?.signal)
      const ratioPath = /^\/api\/workspaces\/([^/]+)\/layout\/ratio$/.exec(path)
      if (ratioPath !== null && init?.method === 'POST') return ratio(decodeURIComponent(ratioPath[1] ?? ''), init)
      const posted = /^\/api\/chats\/([^/]+)\/(focus|zoom|swap|close|split)$/.exec(path)
      if (posted !== null && init?.method === 'POST') {
        const action = posted[2]
        if (action === 'focus' || action === 'zoom' || action === 'swap' || action === 'close' || action === 'split')
          return write(decodeURIComponent(posted[1] ?? ''), action, init)
      }
      return undefined
    },
  }
}

export type FakeWorkspacesServer = ReturnType<typeof fakeWorkspacesServer>
