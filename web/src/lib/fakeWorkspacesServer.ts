// A fake of the server's workspace routes (W5), for tests: `GET
// /api/workspaces`, each workspace's layout (`GET
// /api/workspaces/:workspace/layout`, its chats side by side in one tab, the
// first focused) and the event stream (`GET /api/events`), from one list.
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
// the server's fake agents name it.
import {
  ChatId,
  type ChatSummary,
  type LayoutNode,
  WorkspaceLayout,
  WorkspacesChangedEvent,
  WorkspacesResponse,
} from '@bridge/contract'
import type { FakeTranscriptServer } from './fakeTranscriptServer.ts'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

export function fakeWorkspacesServer(transcripts: FakeTranscriptServer, list: unknown) {
  const encoder = new TextEncoder()
  let response = WorkspacesResponse.parse(list)
  const streams: ReadableStreamDefaultController<Uint8Array>[] = []
  let seq = 0
  let clears = 0

  const layoutOf = (workspace: string) => {
    const chats = response.workspaces.find((w) => w.id === workspace)?.chats ?? []
    const [first, ...rest] = chats
    if (first === undefined) return undefined
    const root = rest.reduce<LayoutNode>(
      (left, c) => ({ kind: 'split', direction: 'row', ratio: 0.5, first: left, second: { kind: 'pane', chat: c.id } }),
      { kind: 'pane', chat: first.id },
    )
    return WorkspaceLayout.parse({
      workspace,
      tabs: [{ id: `${workspace}:t1`, label: 'main', active: true, root, focusedChat: first.id, chats }],
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

  /** Changes the list with `change`, checked against the contract, and tells the event streams. */
  const update = (change: (chat: ChatSummary) => ChatSummary) => {
    response = WorkspacesResponse.parse({
      ...response,
      workspaces: response.workspaces.map((w) => ({ ...w, chats: w.chats.map(change) })),
    })
    changed()
  }

  /** The list change of a /clear: `chat` leaves the list and `next` takes its place, on the same pane. */
  const replaceChat = (chat: string, next: string) => {
    const id = ChatId.parse(next)
    update((c) => (c.id === chat ? { ...c, id } : c))
    transcripts.gone(chat)
  }

  transcripts.onClear((chat) => {
    clears += 1
    replaceChat(chat, `${chat}-c${String(clears)}`)
  })

  return {
    replaceChat,
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
      return undefined
    },
  }
}

export type FakeWorkspacesServer = ReturnType<typeof fakeWorkspacesServer>
