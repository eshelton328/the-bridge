// The mapper test (d-113): domain data in, the view model out, compared
// with the page's state files, so the mocks are the backend's expected output.
import { WorkspacesResponse } from '@bridge/contract'
import { QueryClient } from '@tanstack/react-query'
import { err, ok } from '@bridge/shared'
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
    const state = await withLiveWorkspaces(workspacesHome, {
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.data.workspaces).toEqual(toWorkspaces(response))
    expect(state.data.current).toBe('omni-brain')
    expect(state.data.panes).toBe(workspacesHome.data.panes)
    expect(state.ui).toBe(workspacesHome.ui)
  })

  it('keeps the mock data and gives the notice in the page, the status bar and the error tray when the server is down', async () => {
    const down = () =>
      Promise.resolve(
        err({
          kind: 'status' as const,
          status: 502,
          errorKind: undefined,
          requestId: undefined,
          message: 'the server answered 502: herdr socket: ENOENT',
        }),
      )
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: down })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502: herdr socket: ENOENT); the page shows mock data.',
    )
    expect(state.data.liveNotice).toEqual({
      title: 'Live data unavailable — showing sample data',
      description: 'The server answered 502.',
    })
    expect(getReports().map((r) => r.error.message)).toEqual([state.data.status.alert])
  })

  it('has no notice when the read succeeds', async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.data.liveNotice).toBeUndefined()
  })

  it('does not take a reply the contract refuses for an outage: it rejects, for RouteError', async () => {
    const odd = () => Promise.resolve(ok(WorkspacesResponse.parse({ machine: 'x', workspaces: 'none' })))
    await expect(withLiveWorkspaces(workspacesHome, { client: client(), fetch: odd })).rejects.toThrow()
    expect(getReports()).toEqual([])
  })

  it('does not take a bug in the mapper for an outage: it rejects, for RouteError', async () => {
    // A reply the contract took, with workspaces the mapper cannot read: its throw must not become mock data.
    const broken: WorkspacesResponse = { ...response, workspaces: [] }
    Object.defineProperty(broken, 'workspaces', {
      get: () => {
        throw new Error('a bug in the mapper')
      },
    })
    const state = withLiveWorkspaces(workspacesHome, {
      client: new QueryClient({ defaultOptions: { queries: { retry: false, structuralSharing: false } } }),
      fetch: () => Promise.resolve(ok(broken)),
    })
    await expect(state).rejects.toThrow('a bug in the mapper')
    expect(getReports()).toEqual([])
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
      }).then(ok)
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
    const fetch = vi.fn(() => Promise.resolve(ok(response)))
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

  it('reports a stream that fails three times in a row once, and shows its last error', async () => {
    vi.useFakeTimers()
    try {
      const queries = client()
      let fails = 0
      const open = vi.fn(() => {
        fails += 1
        return Promise.reject(new TypeError(`Failed to fetch ${String(fails)}`))
      })
      const stop = watchLiveWorkspaces({ onChange: () => undefined, client: queries, settleMs: 10, open })
      await vi.advanceTimersByTimeAsync(5000 * 2 + 100)
      expect(open).toHaveBeenCalledTimes(3)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'Live updates lost the event stream (Failed to fetch 1); connecting again.',
      ])
      const state = await withLiveWorkspaces(workspacesHome, {
        client: queries,
        fetch: () => Promise.resolve(ok(response)),
      })
      expect(state.data.status.alert).toBe('Live updates lost the event stream (Failed to fetch 3); connecting again.')
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports nothing when the page closes the stream', async () => {
    const server = fakeServer()
    const stop = watchLiveWorkspaces({ onChange: () => undefined, client: client(), settleMs: 10, open: server.open })
    await settle(5)
    server.opened[0]?.send('event: open\ndata: {}\n\n')
    await settle(5)
    stop()
    await settle(20)
    expect(getReports()).toEqual([])
    expect(server.opened).toHaveLength(1)
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
    const state = await withLiveWorkspaces(workspacesHome, {
      client: queries,
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.data.status.alert).toBe(notice)
    stop()
  })
})

describe('fetchWorkspaces with an error answer (W-1, W-2)', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const answer = (body: string, status: number, requestId?: string) => {
    const headers: Record<string, string> = requestId === undefined ? {} : { 'X-Request-Id': requestId }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(body, { status, headers }))),
    )
  }
  const errorBody = (kind: string, more: Record<string, unknown> = {}) =>
    JSON.stringify({ error: { kind, message: 'herdr is not running', requestId: 'r-42', ...more } })

  it('gives unreachable for a 502 that is not JSON, as the Vite proxy or tailscale serve sends', async () => {
    answer('', 502)
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502); the page shows mock data.',
    )
    expect(state.data.status.alert).not.toMatch(/JSON/)
    expect(state.data.liveNotice?.description).toBe(
      'The-bridge server did not answer (502). Start it or check the tailnet, then reload.',
    )
  })

  it('gives unreachable for an HTML 502 or 503, with the X-Request-Id header when it has one', async () => {
    answer('<html><body>Bad Gateway</body></html>', 502)
    expect(await fetchWorkspaces()).toEqual(
      err({ kind: 'unreachable', status: 502, requestId: undefined, message: 'the server answered 502' }),
    )
    answer('<html><body>Service Unavailable</body></html>', 503, 'r-7')
    expect(await fetchWorkspaces()).toEqual(
      err({ kind: 'unreachable', status: 503, requestId: 'r-7', message: 'the server answered 503 (request r-7)' }),
    )
  })

  it("gives herdr-unavailable with the body's message, kind and request ID, not [object Object]", async () => {
    answer(errorBody('herdr-unavailable'), 503, 'r-header')
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 503: herdr is not running (herdr-unavailable, request r-42)); the page shows mock data.',
    )
    expect(state.data.status.alert).not.toMatch(/object Object/)
    expect(state.data.liveNotice?.description).toBe(
      'Herdr is not available on the server (request r-42). Start it, then reload.',
    )
    expect(await fetchWorkspaces()).toMatchObject({ error: { kind: 'herdr-unavailable', requestId: 'r-42' } })
  })

  it('gives status with the kind for each other kind of the contract', async () => {
    const bodies = [
      { status: 404, kind: 'not-found', more: { path: '/api/workspaces' } },
      { status: 400, kind: 'invalid-input', more: { issues: ['id: Required'] } },
      { status: 502, kind: 'herdr-bad-reply', more: {} },
      { status: 500, kind: 'internal', more: {} },
    ]
    for (const { status, kind, more } of bodies) {
      answer(errorBody(kind, more), status)
      expect(await fetchWorkspaces()).toMatchObject({
        error: { kind: 'status', status, errorKind: kind, requestId: 'r-42' },
      })
    }
  })

  it("drops an error body's reason", async () => {
    answer(errorBody('herdr-unavailable', { reason: 'connect ENOENT herdr.sock' }), 503)
    const answered = await fetchWorkspaces()
    expect(answered).toMatchObject({
      error: { message: 'the server answered 503: herdr is not running (herdr-unavailable, request r-42)' },
    })
    expect(JSON.stringify(answered)).not.toMatch(/herdr\.sock/)
  })

  it('names only the status and request ID of a JSON body that is not an error body', async () => {
    answer(JSON.stringify({ error: 'herdr is not running' }), 500, 'r-9')
    expect(await fetchWorkspaces()).toEqual(
      err({
        kind: 'status',
        status: 500,
        errorKind: undefined,
        requestId: 'r-9',
        message: 'the server answered 500 (request r-9)',
      }),
    )
    answer(JSON.stringify({ error: { kind: 'unknown-kind', message: 'x', requestId: 'r-10' } }), 500)
    expect(await fetchWorkspaces()).toMatchObject({
      error: { kind: 'status', errorKind: undefined, message: 'the server answered 500' },
    })
  })

  it('gives refused for a 403, as the owner check sends', async () => {
    answer(errorBody('forbidden', { message: 'not the owner' }), 403)
    expect(await fetchWorkspaces()).toEqual(
      err({
        kind: 'refused',
        status: 403,
        requestId: 'r-42',
        message: 'the server answered 403: not the owner (forbidden, request r-42)',
      }),
    )
  })

  it('gives unreachable when no answer comes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await fetchWorkspaces()).toEqual(
      err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' }),
    )
  })

  it('throws, not a miss, when a 200 reply does not match the contract', async () => {
    answer(JSON.stringify({ machine: 'mac-mini', workspaces: 'none' }), 200)
    await expect(fetchWorkspaces()).rejects.toThrow()
  })
})
