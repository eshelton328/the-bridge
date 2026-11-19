// The mapper test (d-113): domain data in, the view model out, compared
// with the page's state files, so the mocks are the backend's expected output.
import { WorkspacesResponse } from '@bridge/contract'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { workspacesHome } from './home.ts'
import { fetchWorkspaces, modelLabel, toWorkspaces, watchLiveWorkspaces, withLiveWorkspaces } from './liveWorkspaces.ts'
import { sideChat } from './states/sideChat.ts'
import { workbench } from './states/workbench.ts'

const chat = (local: string, rest: Record<string, unknown>) => ({
  id: `mac-mini/${local}`,
  contextUsed: null,
  parent: null,
  ...rest,
})

// The workspaces of D1 and D2 as the server would send them.
const response = WorkspacesResponse.parse({
  machine: 'mac-mini',
  workspaces: [
    {
      id: 'mac-mini/omni-brain',
      label: 'omni-brain',
      chats: [
        chat('bridge-themes', {
          kind: 'claude',
          title: 'bridge themes',
          model: 'claude-opus-5-5',
          contextUsed: 0.42,
          status: 'working',
        }),
        chat('theme-tokens', {
          kind: 'claude',
          title: 'theme tokens',
          model: 'claude-opus-5-5',
          contextUsed: 0.26,
          status: 'working',
          parent: { id: 'mac-mini/bridge-themes', relation: 'subtask' },
        }),
        chat('drift-check', {
          kind: 'codex',
          title: 'drift check',
          model: 'gpt-5.5',
          contextUsed: 0.23,
          status: 'needsYou',
        }),
        chat('brain-git', { kind: 'shell', title: 'brain git', model: 'zsh', status: 'idle' }),
      ],
    },
    {
      id: 'mac-mini/the-bridge',
      label: 'the-bridge',
      chats: [
        chat('hono-server', {
          kind: 'claude',
          title: 'hono server',
          model: 'claude-sonnet-5-5',
          contextUsed: 0.78,
          status: 'needsYou',
        }),
        chat('dev-server', { kind: 'shell', title: 'dev server', model: 'pnpm dev', status: 'working' }),
      ],
    },
    {
      id: 'mac-mini/omni',
      label: 'omni',
      chats: [
        chat('release-notes', {
          kind: 'codex',
          title: 'release notes',
          model: 'gpt-5.5',
          contextUsed: 0.18,
          status: 'done',
        }),
      ],
    },
    {
      id: 'mac-mini/skill-evals',
      label: 'skill-evals',
      chats: [
        chat('eval-round', {
          kind: 'claude',
          title: 'eval round',
          model: 'claude-opus-5-5',
          contextUsed: 0.31,
          status: 'idle',
        }),
      ],
    },
  ],
})

afterEach(() => {
  clearReports()
  vi.unstubAllGlobals()
})

describe('the live mapper', () => {
  it("gives D1's workspace tabs (states/workbench.ts)", () => {
    const tabs = toWorkspaces(response).map(({ id, label, count, needsYou }) => ({ id, label, count, needsYou }))
    expect(tabs).toEqual(workbench.data.workspaces)
  })

  it("gives D2's sidebar chats (states/sideChat.ts) for each workspace D2 draws open", () => {
    const mapped = toWorkspaces(response)
    for (const workspace of sideChat.data.workspaces) {
      // Figma draws skill-evals closed, so D2 does not know its chats.
      if (workspace.id === 'skill-evals') continue
      expect(mapped.find((w) => w.id === workspace.id)?.chats).toEqual(workspace.chats)
    }
  })

  it('marks a fork with the title of the chat it came from', () => {
    const fork = WorkspacesResponse.parse({
      machine: 'mac-mini',
      workspaces: [
        {
          id: 'mac-mini/w1',
          label: 'w1',
          chats: [
            chat('a', { kind: 'claude', title: 'bridge themes', model: null, status: 'idle' }),
            chat('b', {
              kind: 'claude',
              title: 'copy',
              model: null,
              status: 'unknown',
              parent: { id: 'mac-mini/a', relation: 'fork' },
            }),
          ],
        },
      ],
    })
    expect(toWorkspaces(fork)[0]?.chats?.[1]).toEqual({
      id: 'b',
      kind: 'claude',
      title: 'copy',
      model: 'Claude Code',
      status: { label: 'Unknown', tone: 'idle' },
      level: 1,
      mark: { kind: 'fork', label: 'Fork of bridge themes' },
    })
    expect(toWorkspaces(fork)[0]?.count).toBe(1)
  })

  it('writes model IDs as the app does', () => {
    expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5')
    expect(modelLabel('claude-fable-5-2[1m]')).toBe('Fable 5.2')
    expect(modelLabel('gpt-5.5-codex')).toBe('GPT-5.5-codex')
    expect(modelLabel('o9')).toBe('o9')
  })
})

describe('withLiveWorkspaces', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

  it("puts the server's workspaces on the home state and shows the first one", async () => {
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: () => Promise.resolve(response) })
    expect(state.data.workspaces).toEqual(toWorkspaces(response))
    expect(state.data.current).toBe('omni-brain')
    expect(state.data.panes).toBe(workspacesHome.data.panes)
    expect(state.ui).toBe(workspacesHome.ui)
  })

  it('keeps the mock data and gives the notice in the status bar and the error tray when the server is down', async () => {
    const down = () => Promise.reject(new Error('the server answered 502: herdr socket: ENOENT'))
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: down })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502: herdr socket: ENOENT); the page shows mock data.',
    )
    expect(getReports().map((r) => r.error.message)).toEqual([state.data.status.alert])
  })

  it('keeps the mock data when the server sends a reply the contract refuses', async () => {
    const odd = () => Promise.resolve(WorkspacesResponse.parse({ machine: 'x', workspaces: 'none' }))
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: odd })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toMatch(/^Live data is not available/)
    expect(getReports().map((r) => r.error.message)).toEqual([state.data.status.alert])
  })
})

/** A server's event stream that the test writes: each open gives a new stream, as a reconnect does. */
function fakeServer() {
  const encoder = new TextEncoder()
  const opened: { send: (text: string) => void; end: () => void }[] = []
  let refuse: number | undefined
  const open = (signal: AbortSignal) => {
    if (refuse !== undefined) return Promise.resolve(new Response('{"error":"no"}', { status: refuse }))
    let control: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        control = c
      },
    })
    signal.addEventListener('abort', () => {
      control?.error(new Error('aborted'))
    })
    opened.push({
      send: (text) => control?.enqueue(encoder.encode(text)),
      end: () => control?.close(),
    })
    return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
  }
  return {
    open,
    opened,
    refuseWith: (status: number) => {
      refuse = status
    },
    /** The SSE text of one event. */
    frame: (event: string, data: unknown, extra = '') => `${extra}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  }
}

describe('watchLiveWorkspaces', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const status = (chat: string, value: string, seq = 0) => ({
    source: 'mac-mini/agents',
    seq,
    type: 'chat.status',
    data: { chat, status: value },
  })
  const changed = { source: 'mac-mini/agents', seq: 0, type: 'workspaces.changed', data: {} }
  const settle = (ms = 40) => new Promise((r) => setTimeout(r, ms))

  it("puts a chat's new status in the cache, then loads the page once for a burst", async () => {
    const queries = client()
    queries.setQueryData(['workspaces'], response)
    const server = fakeServer()
    const onChange = vi.fn()
    const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
    await settle(5)
    // A ping comment and two events in one chunk, the second split across two chunks.
    const second = server.frame('chat.status', status('mac-mini/bridge-themes', 'done', 1))
    server.opened[0]?.send(
      `: ping\n\n${server.frame('chat.status', status('mac-mini/drift-check', 'idle'))}${second.slice(0, 20)}`,
    )
    server.opened[0]?.send(second.slice(20))
    await settle()
    expect(onChange).toHaveBeenCalledTimes(1)
    const chats = queries.getQueryData<WorkspacesResponse>(['workspaces'])?.workspaces[0]?.chats ?? []
    expect(chats.find((c) => c.id === 'mac-mini/drift-check')?.status).toBe('idle')
    expect(chats.find((c) => c.id === 'mac-mini/bridge-themes')?.status).toBe('done')
    expect(queries.getQueryState(['workspaces'])?.isInvalidated).toBe(false)
    stop()
  })

  it('marks the cache invalid when the stream opens, the list changed or the cache does not hold the chat', async () => {
    const server = fakeServer()
    for (const text of [
      'event: open\ndata: {}\nretry: 5000\n\n',
      server.frame('workspaces.changed', changed),
      server.frame('chat.status', status('mac-mini/new-chat', 'working')),
      'event: chat.status\ndata: not json\n\n',
    ]) {
      const queries = client()
      queries.setQueryData(['workspaces'], response)
      const onChange = vi.fn()
      const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
      await settle(5)
      server.opened.at(-1)?.send(text)
      await settle()
      expect(queries.getQueryState(['workspaces'])?.isInvalidated).toBe(true)
      expect(onChange).toHaveBeenCalledTimes(1)
      stop()
    }
  })

  it('keeps the cache invalid when a status event comes after a list change', async () => {
    const queries = client()
    queries.setQueryData(['workspaces'], response)
    const server = fakeServer()
    const stop = watchLiveWorkspaces({ onChange: () => undefined, client: queries, settleMs: 10, open: server.open })
    await settle(5)
    server.opened[0]?.send(server.frame('workspaces.changed', changed))
    server.opened[0]?.send(server.frame('chat.status', status('mac-mini/drift-check', 'idle', 1)))
    await settle()
    expect(queries.getQueryState(['workspaces'])?.isInvalidated).toBe(true)
    stop()
  })

  it('reads again when an event came while a read ran, so an older answer does not stay', async () => {
    const queries = client()
    const server = fakeServer()
    const onChange = vi.fn()
    const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
    await settle(5)
    let answer: (value: WorkspacesResponse) => void = () => undefined
    const slow = () =>
      new Promise<WorkspacesResponse>((resolve) => {
        answer = resolve
      })
    const loading = withLiveWorkspaces(workspacesHome, { client: queries, fetch: slow })
    await settle(5)
    server.opened[0]?.send(server.frame('chat.status', status('mac-mini/drift-check', 'idle')))
    await settle(5)
    // The read answers with what the server had before the event: drift check still needs the owner.
    answer(response)
    await loading
    await settle()
    expect(queries.getQueryState(['workspaces'])?.isInvalidated).toBe(true)
    expect(onChange).toHaveBeenCalled()
    stop()
  })

  it('reads the cache while it watches, and the server again once the cache is invalid', async () => {
    const queries = client()
    const server = fakeServer()
    const fetch = vi.fn(() => Promise.resolve(response))
    const stop = watchLiveWorkspaces({ onChange: () => undefined, client: queries, settleMs: 10, open: server.open })
    await withLiveWorkspaces(workspacesHome, { client: queries, fetch })
    await settle(5)
    server.opened[0]?.send(server.frame('chat.status', status('mac-mini/drift-check', 'idle')))
    await settle()
    const state = await withLiveWorkspaces(workspacesHome, { client: queries, fetch })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(state.data.workspaces[0]?.chats?.find((c) => c.id === 'drift-check')?.status.label).toBe('Idle')
    server.opened[0]?.send(server.frame('workspaces.changed', changed))
    await settle()
    await withLiveWorkspaces(workspacesHome, { client: queries, fetch })
    expect(fetch).toHaveBeenCalledTimes(2)
    stop()
  })

  it("connects again after the server's retry time when the stream ends, and not at once", async () => {
    const server = fakeServer()
    const stop = watchLiveWorkspaces({ onChange: () => undefined, client: client(), settleMs: 10, open: server.open })
    await settle(5)
    server.opened[0]?.send('event: open\ndata: {}\nretry: 100\n\n')
    server.opened[0]?.end()
    await settle(40)
    expect(server.opened).toHaveLength(1)
    await settle(120)
    expect(server.opened).toHaveLength(2)
    stop()
    await settle(150)
    expect(server.opened).toHaveLength(2)
  })

  it('stops with a notice in the status bar and the error tray when the server refuses the stream', async () => {
    const queries = client()
    const server = fakeServer()
    server.refuseWith(403)
    const onChange = vi.fn()
    const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
    await settle()
    const notice =
      'Live updates stopped (the server answered 403 for the event stream); reload the page to start them again.'
    expect(getReports().map((r) => r.error.message)).toEqual([notice])
    expect(onChange).toHaveBeenCalledTimes(1)
    const state = await withLiveWorkspaces(workspacesHome, { client: queries, fetch: () => Promise.resolve(response) })
    expect(state.data.status.alert).toBe(notice)
    stop()
  })
})

describe('fetchWorkspaces with an error answer (W-1)', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const answer = (body: string, status: number, requestId?: string) => {
    const headers: Record<string, string> = requestId === undefined ? {} : { 'X-Request-Id': requestId }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(body, { status, headers }))),
    )
  }

  it('names the status of a 502 that is not JSON, as the Vite proxy or tailscale serve sends', async () => {
    answer('', 502)
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502); the page shows mock data.',
    )
    expect(state.data.status.alert).not.toMatch(/JSON/)
  })

  it('names the status of an HTML error page, with the X-Request-Id header when it has one', async () => {
    answer('<html><body>Bad Gateway</body></html>', 502)
    await expect(fetchWorkspaces()).rejects.toMatchObject({
      message: 'the server answered 502',
      status: 502,
      kind: undefined,
      requestId: undefined,
    })
    answer('<html><body>Bad Gateway</body></html>', 503, 'r-7')
    await expect(fetchWorkspaces()).rejects.toMatchObject({
      message: 'the server answered 503 (request r-7)',
      status: 503,
      kind: undefined,
      requestId: 'r-7',
    })
  })

  it("gives an error body's message, kind and request ID, not [object Object]", async () => {
    const error = { kind: 'herdr-unavailable', message: 'herdr is not running', requestId: 'r-42' }
    answer(JSON.stringify({ error }), 503, 'r-header')
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 503: herdr is not running (herdr-unavailable, request r-42)); the page shows mock data.',
    )
    expect(state.data.status.alert).not.toMatch(/object Object/)
    await expect(fetchWorkspaces()).rejects.toMatchObject({ status: 503, kind: 'herdr-unavailable', requestId: 'r-42' })
  })

  it('reads each kind of the contract, with its own fields', async () => {
    const bodies = [
      { status: 403, error: { kind: 'forbidden' } },
      { status: 404, error: { kind: 'not-found', path: '/api/workspaces' } },
      { status: 400, error: { kind: 'invalid-input', issues: ['id: Required'] } },
      { status: 502, error: { kind: 'herdr-bad-reply' } },
      { status: 500, error: { kind: 'internal' } },
    ]
    for (const { status, error } of bodies) {
      answer(JSON.stringify({ error: { ...error, message: 'no', requestId: 'r-1' } }), status)
      await expect(fetchWorkspaces()).rejects.toMatchObject({ status, kind: error.kind, requestId: 'r-1' })
    }
  })

  it("drops an error body's reason", async () => {
    const error = { kind: 'herdr-unavailable', message: 'herdr is not running', requestId: 'r-3' }
    answer(JSON.stringify({ error: { ...error, reason: 'connect ENOENT herdr.sock' } }), 503)
    const thrown: unknown = await fetchWorkspaces().catch((e: unknown) => e)
    expect(thrown).toMatchObject({
      message: 'the server answered 503: herdr is not running (herdr-unavailable, request r-3)',
    })
    expect(String(thrown)).not.toMatch(/herdr\.sock/)
  })

  it('names only the status and request ID of a JSON body that is not an error body', async () => {
    answer(JSON.stringify({ error: 'herdr is not running' }), 500, 'r-9')
    await expect(fetchWorkspaces()).rejects.toMatchObject({
      message: 'the server answered 500 (request r-9)',
      status: 500,
      kind: undefined,
      requestId: 'r-9',
    })
    answer(JSON.stringify({ error: { kind: 'unknown-kind', message: 'x', requestId: 'r-10' } }), 500)
    await expect(fetchWorkspaces()).rejects.toMatchObject({ message: 'the server answered 500', kind: undefined })
  })
})
