// A stubbed the-bridge server for route tests that open the Workspaces live source (d-117): the Workspaces home
// reads it with no ?state=, and with ?source=live. Without a stub the read goes through the Vite proxy to whatever
// server runs on the machine, so the test result depends on that machine (lib/testSetup.ts fails such a read).
import { type LayoutNode, WorkspacesResponse } from '@bridge/contract'
import { afterAll, beforeAll } from 'vitest'

type Chat = { readonly local: string; readonly kind: 'claude' | 'codex' | 'shell'; readonly title: string }

const summary = (c: Chat) => ({
  id: `mac-mini/${c.local}`,
  kind: c.kind,
  title: c.title,
  model: c.kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `mac-mini/pane-${c.local}`,
  status: 'idle',
  parent: null,
})

/** A server workspace list: one workspace, "live work", with a Claude chat, a shell and the chats `more`. */
export const liveWorkspacesWith = (...more: Chat[]) =>
  WorkspacesResponse.parse({
    machine: 'mac-mini',
    workspaces: [
      {
        id: 'mac-mini/w-live',
        label: 'live work',
        chats: [
          summary({ local: 'p1', kind: 'claude', title: 'plan the slice' }),
          summary({ local: 's1', kind: 'shell', title: 'tail logs' }),
          ...more.map(summary),
        ],
      },
    ],
  })

/** The server's workspace list: one workspace, "live work", with a Claude chat and a shell. */
const liveWorkspacesBody = liveWorkspacesWith()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** A workspace's layout in the list `body`: one active tab with its chats side by side, its first chat focused. */
function layoutOf(body: unknown, id: string): Response {
  const list = WorkspacesResponse.safeParse(body)
  const chats = (list.success ? list.data : liveWorkspacesBody).workspaces.find((w) => w.id === id)?.chats ?? []
  const [first, ...rest] = chats
  if (first === undefined) return json({ error: { kind: 'not-found', message: 'none', requestId: 'r-1' } }, 404)
  const root = rest.reduce<LayoutNode>(
    (left, c) => ({ kind: 'split', direction: 'row', ratio: 0.5, first: left, second: { kind: 'pane', chat: c.id } }),
    { kind: 'pane', chat: first.id },
  )
  return json({
    workspace: id,
    tabs: [{ id: `${id}:t1`, label: 'main', active: true, root, focusedChat: first.id, zoomed: false, chats }],
  })
}

/** The event stream: it opens, sends nothing more and ends when the page aborts it. */
function events(signal: AbortSignal | null | undefined): Response {
  // The page's reader can end the stream first; then there is nothing to close.
  let ended = false
  const body = new ReadableStream<Uint8Array>({
    start: (control) => {
      control.enqueue(new TextEncoder().encode('event: open\ndata: {}\n\n'))
      signal?.addEventListener('abort', () => {
        if (ended) return
        ended = true
        control.close()
      })
    },
    cancel: () => {
      ended = true
    },
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

export type LiveServerStubOptions = {
  /** The body of `GET /api/workspaces`; `liveWorkspacesBody` when not set, such as a reply the contract refuses. */
  readonly workspaces?: unknown
}

/**
 * What the stub saw: the body of each `POST /api/client-errors`, which it answers 204, as the server does. A test sets
 * `workspaces` to change the list (and its layouts) that later reads get, such as a chat made since the last read.
 */
export type LiveServerStub = { readonly clientErrors: string[]; workspaces?: unknown }

/**
 * Answers the API as a server with `liveWorkspacesBody` would, from the file's first test to its last; any other URL
 * goes to the real fetch. Call it at the top of a test file whose tests render a route that reads the live source. It
 * stays for the whole file, as a page can start a read after its test ended: the router still runs a load that the
 * page's last event started, and that read must not reach the real server in the next test.
 */
export function stubLiveServer(options: LiveServerStubOptions = {}): LiveServerStub {
  const stub: LiveServerStub = { clientErrors: [] }
  let before: typeof globalThis.fetch | undefined
  beforeAll(() => {
    const real = globalThis.fetch
    before = real
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        window.location.origin,
      )
      if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) return real(input, init)
      const body = stub.workspaces ?? options.workspaces ?? liveWorkspacesBody
      if (url.pathname === '/api/workspaces') return Promise.resolve(json(body))
      if (url.pathname === '/api/client-errors' && init?.method === 'POST') {
        stub.clientErrors.push(typeof init.body === 'string' ? init.body : '')
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(url.pathname)
      if (layout?.[1] !== undefined) return Promise.resolve(layoutOf(body, decodeURIComponent(layout[1])))
      if (url.pathname === '/api/events') return Promise.resolve(events(init?.signal))
      return Promise.resolve(json({ error: { kind: 'not-found', message: 'no stub', requestId: 'r-1' } }, 404))
    }
  })
  afterAll(() => {
    stub.workspaces = undefined
    if (before !== undefined) globalThis.fetch = before
  })
  return stub
}
