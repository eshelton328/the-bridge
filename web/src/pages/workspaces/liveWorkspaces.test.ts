// The mapper test (d-113): domain data in, the view model out, compared
// with the page's state files, so the mocks are the backend's expected output.
import { WorkspaceLayout, WorkspacesResponse } from '@bridge/contract'
import { QueryClient } from '@tanstack/react-query'
import { err, ok, type Result } from '@bridge/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { checkState } from '../../lib/screenState.ts'
import { workspacesHome } from './home.ts'
import {
  fetchWorkspaces,
  type LiveMiss,
  liveReadTimeoutMs,
  livePanes,
  modelLabel,
  readAfterClear,
  toWorkspaces,
  watchLiveWorkspaces,
  withLiveWorkspaces,
} from './liveWorkspaces.ts'
import { sideChat } from './states/sideChat.ts'
import { workbench } from './states/workbench.ts'
import { WorkspacesState } from './types.ts'

const chat = (local: string, rest: Record<string, unknown>) => ({
  id: `mac-mini/${local}`,
  modelId: null,
  effort: null,
  contextUsed: null,
  parent: null,
  pane: `mac-mini/pane-${local}`,
  ...rest,
})

// A list that still has the cleared chat `mac-mini/a`.
const stillListed = WorkspacesResponse.parse({
  machine: 'mac-mini',
  workspaces: [
    {
      id: 'mac-mini/w1',
      label: 'w1',
      chats: [chat('a', { kind: 'claude', title: 'a', model: 'claude-opus-5-5', status: 'idle' })],
    },
  ],
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

/**
 * A layout read with no server, as in CI: the page keeps each workspace's first chats. A test that passes only
 * `fetch` would read the layouts from the real server on this machine, so its result would depend on the machine.
 */
const noLayout = () =>
  Promise.resolve(
    err({
      kind: 'unreachable' as const,
      status: undefined,
      requestId: undefined,
      message: 'the server did not answer',
    }),
  )

afterEach(() => {
  clearReports()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
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
      // Each live row names its pane (W5, pane follow), which a Figma state has no need of.
      const chats = mapped.find((w) => w.id === workspace.id)?.chats
      expect(chats?.map((c) => c.pane)).toEqual(workspace.chats.map((c) => `mac-mini/pane-${c.id}`))
      expect(chats?.map((c) => Object.fromEntries(Object.entries(c).filter(([key]) => key !== 'pane')))).toEqual(
        workspace.chats,
      )
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
      pane: 'mac-mini/pane-b',
    })
    expect(toWorkspaces(fork)[0]?.count).toBe(1)
  })

  it('gives a shell row "shell · <program>" ("shell" with no program) and no context meter', () => {
    const shells = WorkspacesResponse.parse({
      machine: 'mac-mini',
      workspaces: [
        {
          id: 'mac-mini/w1',
          label: 'w1',
          chats: [
            chat('dev', { kind: 'shell', title: 'dev server', model: 'pnpm dev', contextUsed: 0.3, status: 'working' }),
            chat('sh', { kind: 'shell', title: 'a shell', model: null, status: 'idle' }),
            chat('pipe', { kind: 'shell', title: 'logs', model: 'tail -f a.log | grep err', status: 'idle' }),
          ],
        },
      ],
    })
    expect(toWorkspaces(shells)[0]?.chats).toEqual([
      {
        id: 'dev',
        kind: 'shell',
        title: 'dev server',
        model: 'shell · pnpm dev',
        status: { label: 'Running', tone: 'running' },
        pane: 'mac-mini/pane-dev',
      },
      {
        id: 'sh',
        kind: 'shell',
        title: 'a shell',
        model: 'shell',
        status: { label: 'Idle', tone: 'idle' },
        pane: 'mac-mini/pane-sh',
      },
      {
        id: 'pipe',
        kind: 'shell',
        title: 'logs',
        model: 'shell · tail -f a.log | grep err',
        status: { label: 'Idle', tone: 'idle' },
        pane: 'mac-mini/pane-pipe',
      },
    ])
  })

  it("gives a live Claude chat's effort to its pane header, read-only, and takes commands only when idle or done", () => {
    const live = WorkspacesResponse.parse({
      machine: 'mac-mini',
      workspaces: [
        {
          id: 'mac-mini/w1',
          label: 'w1',
          chats: [
            chat('a', { kind: 'claude', title: 'a', model: 'claude-opus-5-5', effort: 'xhigh', status: 'idle' }),
            chat('b', { kind: 'claude', title: 'b', model: 'claude-opus-5-5', status: 'done' }),
            chat('c', { kind: 'claude', title: 'c', model: 'claude-opus-5-5', status: 'unknown' }),
            chat('d', { kind: 'claude', title: 'd', model: 'claude-opus-5-5', status: 'needsYou' }),
            chat('e', { kind: 'codex', title: 'e', model: 'gpt-5.5', status: 'idle' }),
          ],
        },
      ],
    })
    const panes = livePanes(toWorkspaces(live), 'mac-mini')
    const first = panes[0]
    expect(first?.type === 'chat' ? first.head : undefined).toMatchObject({
      model: 'Opus 5.5',
      effort: 'xhigh effort',
      readOnlyModel: true,
    })
    expect(panes.map((p) => (p.type === 'chat' ? p.takesCommands : 'none'))).toEqual([
      true,
      true,
      false,
      false,
      undefined,
    ])
  })

  it('reads the list after a /clear, one read after another, until the cleared chat has left it', async () => {
    const listed = (id: string) =>
      WorkspacesResponse.parse({
        machine: 'mac-mini',
        workspaces: [
          {
            id: 'mac-mini/w1',
            label: 'w1',
            chats: [chat(id, { kind: 'claude', title: 'a', model: 'claude-opus-5-5', status: 'idle' })],
          },
        ],
      })
    const answers = [listed('a'), listed('a'), listed('a-new')]
    let reads = 0
    let inFlight = 0
    const read = async () => {
      inFlight += 1
      expect(inFlight).toBe(1)
      await Promise.resolve()
      inFlight -= 1
      const answer = answers[reads] ?? listed('a-new')
      reads += 1
      return ok(answer)
    }
    const left = await readAfterClear('mac-mini/a', {
      read,
      wait: () => Promise.resolve(),
      signal: new AbortController().signal,
    })
    expect(left).toBe(true)
    expect(reads).toBe(3)
  })

  it('reads no more after a /clear once the page closes the open watcher', async () => {
    const stop = watchLiveWorkspaces({ onChange: () => undefined, open: () => new Promise<Response>(() => undefined) })
    let reads = 0
    let waits = 0
    const left = await readAfterClear('mac-mini/a', {
      read: () => {
        reads += 1
        return Promise.resolve(ok(stillListed))
      },
      wait: () => {
        waits += 1
        // The page unmounts during the second wait.
        if (waits === 2) stop()
        return Promise.resolve()
      },
    })
    expect(left).toBe(false)
    expect(reads).toBe(1)
  })

  it('ends quietly when the page closes the watcher during a read, and makes no further read', async () => {
    const page = new AbortController()
    let reads = 0
    const left = await readAfterClear('mac-mini/a', {
      signal: page.signal,
      wait: () => Promise.resolve(),
      read: (signal) => {
        reads += 1
        page.abort()
        signal.throwIfAborted()
        return Promise.resolve(ok(stillListed))
      },
    })
    expect(left).toBe(false)
    expect(reads).toBe(1)
  })

  it('throws a read error that is not its own abort', async () => {
    const broken = new SyntaxError('not JSON')
    await expect(
      readAfterClear('mac-mini/a', {
        signal: new AbortController().signal,
        wait: () => Promise.resolve(),
        read: () => Promise.reject(broken),
      }),
    ).rejects.toBe(broken)
  })

  it('reads nothing after a /clear with no open watcher, as there is no page to load again', async () => {
    let reads = 0
    const left = await readAfterClear('mac-mini/a', {
      wait: () => Promise.resolve(),
      read: () => {
        reads += 1
        return Promise.resolve(ok(stillListed))
      },
    })
    expect(left).toBe(false)
    expect(reads).toBe(0)
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

  it("puts the server's workspaces on the home state, a pane for each chat, and shows the first one", async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.data.workspaces).toEqual(toWorkspaces(response))
    expect(state.data.current).toBe('omni-brain')
    expect(state.data.panes).toEqual(livePanes(toWorkspaces(response), response.machine))
    expect(state.ui.focusedPane).toBe('bridge-themes')
    expect(checkState(WorkspacesState, state).ok).toBe(true)
  })

  it('gives each workspace its own layout of its own chats, its first chat focused', async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.ui.layouts).toEqual({
      'omni-brain': {
        panes: ['bridge-themes', 'theme-tokens', 'drift-check', 'brain-git'],
        focusedPane: 'bridge-themes',
      },
      'the-bridge': { panes: ['hono-server', 'dev-server'], focusedPane: 'hono-server' },
      omni: { panes: ['release-notes'], focusedPane: 'release-notes' },
      'skill-evals': { panes: ['eval-round'], focusedPane: 'eval-round' },
    })
  })

  it("gives each live chat a pane with no sample text: a shell's terminal and a Codex transcript are not live yet, a Claude transcript is read by its chat ID", async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    const chats = toWorkspaces(response).flatMap((w) => w.chats ?? [])
    expect(state.data.panes.map((p) => p.id)).toEqual(chats.map((c) => c.id))
    for (const pane of state.data.panes) {
      if (pane.type === 'chat') {
        expect(pane.entries).toEqual([])
        expect(pane.composer.text).toBe('')
        if (pane.head.kind === 'claude') {
          // The page reads a Claude chat's transcript while the pane shows (liveTranscript.ts), by its server chat ID.
          expect(pane.notLive).toBeUndefined()
          expect(pane.liveChat).toBe(`${response.machine}/${pane.id}`)
        } else {
          // The server reads no Codex transcript yet: the pane says so and the page reads nothing.
          expect(pane.notLive).toBe('Transcript not live yet')
          expect(pane.liveChat).toBeUndefined()
        }
      } else if (pane.type === 'shell') {
        expect(pane.lines).toEqual([])
        expect(pane.notLive).toBe('Terminal not live yet')
      }
    }
    expect(state.data.panes.find((p) => p.id === 'brain-git')?.type).toBe('shell')
    // None of the home's sample parts.
    expect(state.data.sideChat).toBeUndefined()
    expect(state.data.subagents).toBeUndefined()
    expect(state.data.folders).toBeUndefined()
    expect(state.data.lastChats).toBeUndefined()
    expect(state.data.chatMenu?.map((a) => a.value)).not.toContain('subagents')
    // Reviews R41, R42: only the actions a route backs (Rename since backend #423, Move to workspace since #435, with
    // no New workspace row, Fork since #443, Side chat since #460), and Edit with Done on the phone's list. The desktop
    // workbench's pane menu has no rename field, so it has New chat, Fork, Side chat and Move to workspace.
    expect(state.data.chatMenu?.map((a) => a.value)).toEqual(['newChat', 'fork', 'sideChat', 'move', 'rename'])
    expect(state.data.paneMenu.map((a) => a.value)).toEqual(['newChat', 'fork', 'sideChat', 'move'])
    expect(state.data.phone?.chatMenu?.map((a) => a.value)).toEqual(['newChat', 'fork', 'sideChat', 'move', 'rename'])
    expect(state.data.newWorkspace).toBeUndefined()
    expect(state.data.phone?.edit).toBe('Edit')
    expect(state.data.phone?.done).toBe('Done')
  })

  it('shows no workspaces, with the notice in the page and the status bar and no sample summary, and reports nothing when the server is down', async () => {
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
    const state = await withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: client(), fetch: down })
    expect(state.data.workspaces).toEqual([])
    expect(state.data.current).toBeNull()
    expect(state.data.panes).toEqual([])
    expect(state.data.lastChats).toBeUndefined()
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502: herdr socket: ENOENT); the page shows no workspaces.',
    )
    expect(state.data.liveNotice).toEqual({
      title: 'Live data unavailable — no workspaces shown',
      description: 'The server answered 502.',
    })
    expect(state.data.status.summary).toBeUndefined()
    expect(checkState(WorkspacesState, state).ok).toBe(true)
    // The page shows the miss, so the dev ErrorTray does not count it.
    expect(getReports()).toEqual([])
  })

  it('has no notice when the read succeeds', async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      fetch: () => Promise.resolve(ok(response)),
    })
    expect(state.data.liveNotice).toBeUndefined()
  })

  it('does not take a reply the contract refuses for an outage: it rejects, for RouteError', async () => {
    const odd = () => Promise.resolve(ok(WorkspacesResponse.parse({ machine: 'x', workspaces: 'none' })))
    await expect(
      withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: client(), fetch: odd }),
    ).rejects.toThrow()
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
      fetchLayout: noLayout,
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
    const loading = withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: queries, fetch: slow })
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

  it("reads a shown workspace's layout again on layout.changed after the query client dropped its query", async () => {
    const queries = client()
    const server = fakeServer()
    const onChange = vi.fn()
    const layout = WorkspaceLayout.parse({
      workspace: 'mac-mini/omni-brain',
      tabs: [
        {
          id: 'mac-mini/omni-brain:t1',
          label: 'main',
          active: true,
          root: { kind: 'pane', chat: 'mac-mini/bridge-themes' },
          focusedChat: 'mac-mini/bridge-themes',
          zoomed: false,
          chats: [response.workspaces[0]?.chats[0]],
        },
      ],
    })
    const fetchLayout = vi.fn(() => Promise.resolve(ok(layout)))
    await withLiveWorkspaces(workspacesHome, {
      client: queries,
      fetch: () => Promise.resolve(ok(response)),
      fetchLayout,
    })
    const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
    await settle(5)
    // What the query client does to a query no component observes after five idle minutes.
    queries.removeQueries({ queryKey: ['workspaces', 'layout'] })
    server.opened[0]?.send(
      server.frame('layout.changed', {
        source: 'mac-mini/agents',
        seq: 1,
        type: 'layout.changed',
        data: { workspace: 'mac-mini/omni-brain' },
      }),
    )
    await settle()
    expect(onChange).toHaveBeenCalledTimes(1)
    // A workspace the page does not show reads nothing.
    server.opened[0]?.send(
      server.frame('layout.changed', {
        source: 'mac-mini/agents',
        seq: 2,
        type: 'layout.changed',
        data: { workspace: 'mac-mini/gone' },
      }),
    )
    await settle()
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
  })

  it('reads the cache while it watches, and the server again once the cache is invalid', async () => {
    const queries = client()
    const server = fakeServer()
    const fetch = vi.fn(() => Promise.resolve(ok(response)))
    const stop = watchLiveWorkspaces({ onChange: () => undefined, client: queries, settleMs: 10, open: server.open })
    await withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: queries, fetch })
    await settle(5)
    server.opened[0]?.send(server.frame('chat.status', status('mac-mini/drift-check', 'idle')))
    await settle()
    const state = await withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: queries, fetch })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(state.data.workspaces[0]?.chats?.find((c) => c.id === 'drift-check')?.status.label).toBe('Idle')
    server.opened[0]?.send(server.frame('workspaces.changed', changed))
    await settle()
    await withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: queries, fetch })
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

  it('shows the last error of a stream that fails three times in a row, and reports none', async () => {
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
      expect(getReports()).toEqual([])
      const state = await withLiveWorkspaces(workspacesHome, {
        fetchLayout: noLayout,
        client: queries,
        fetch: () => Promise.resolve(ok(response)),
      })
      expect(state.data.status.alert).toBe('Live updates lost the event stream (Failed to fetch 3); connecting again.')
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the lost line after the grace when the reconnect after a drop gets no answer at all (R43)', async () => {
    vi.useFakeTimers()
    try {
      const queries = client()
      let calls = 0
      const open = vi.fn((signal: AbortSignal) => {
        calls += 1
        // The first stream opens, then drops; each next one gets no answer until the page aborts it.
        if (calls === 1)
          return Promise.resolve(
            new Response(
              new ReadableStream<Uint8Array>({
                start: (c) => {
                  c.enqueue(new TextEncoder().encode('event: open\ndata: {}\n\n'))
                  setTimeout(() => {
                    c.error(new TypeError('network error'))
                  }, 10)
                },
              }),
              { status: 200 },
            ),
          )
        return new Promise<Response>((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      })
      const stop = watchLiveWorkspaces({ onChange: () => undefined, client: queries, settleMs: 10, open })
      await vi.advanceTimersByTimeAsync(5000 + liveReadTimeoutMs + 1000)
      expect(getReports()).toEqual([])
      const state = await withLiveWorkspaces(workspacesHome, {
        fetchLayout: noLayout,
        client: queries,
        fetch: () => Promise.resolve(ok(response)),
      })
      expect(state.data.status.alert).toBe(
        'Live updates lost the event stream (no answer within 8 s); connecting again.',
      )
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

  it('connects again after a 5xx, as the Vite proxy answers while the server is down, and loads once it opens', async () => {
    vi.useFakeTimers()
    const server = fakeServer()
    let calls = 0
    const open = (signal: AbortSignal) => {
      calls += 1
      return calls === 1 ? Promise.resolve(new Response('', { status: 500 })) : server.open(signal)
    }
    const onChange = vi.fn()
    const stop = watchLiveWorkspaces({ onChange, client: client(), settleMs: 10, open })
    await vi.advanceTimersByTimeAsync(20)
    expect(getReports()).toEqual([])
    onChange.mockClear()
    await vi.advanceTimersByTimeAsync(5000)
    expect(calls).toBe(2)
    server.opened[0]?.send(server.frame('open', {}))
    await vi.advanceTimersByTimeAsync(20)
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
  })

  it('stops with a notice in the status bar, and reports nothing, when the server refuses the stream', async () => {
    const queries = client()
    const server = fakeServer()
    server.refuseWith(403)
    const onChange = vi.fn()
    const stop = watchLiveWorkspaces({ onChange, client: queries, settleMs: 10, open: server.open })
    await settle()
    const notice =
      'Live updates stopped (the server answered 403 for the event stream); reload the page to start them again.'
    expect(getReports()).toEqual([])
    expect(onChange).toHaveBeenCalledTimes(1)
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
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
    expect(state.data.workspaces).toEqual([])
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502); the page shows no workspaces.',
    )
    expect(state.data.status.alert).not.toMatch(/JSON/)
    expect(state.data.liveNotice?.description).toBe(
      'The-bridge server did not answer (502). Start it or check the tailnet, then retry.',
    )
  })

  it('gives unreachable for a 500 with an empty body, as the Vite proxy sends while the server is down', async () => {
    answer('', 500)
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({ kind: 'unreachable', status: 500, requestId: undefined, message: 'the server answered 500' }),
    )
  })

  it('gives unreachable for an HTML 502 or 503, with the X-Request-Id header when it has one', async () => {
    answer('<html><body>Bad Gateway</body></html>', 502)
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({ kind: 'unreachable', status: 502, requestId: undefined, message: 'the server answered 502' }),
    )
    answer('<html><body>Service Unavailable</body></html>', 503, 'r-7')
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({ kind: 'unreachable', status: 503, requestId: 'r-7', message: 'the server answered 503 (request r-7)' }),
    )
  })

  it("gives herdr-unavailable with the body's message, kind and request ID, not [object Object]", async () => {
    answer(errorBody('herdr-unavailable'), 503, 'r-header')
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 503: herdr is not running (herdr-unavailable, request r-42)); the page shows no workspaces.',
    )
    expect(state.data.status.alert).not.toMatch(/object Object/)
    expect(state.data.liveNotice?.description).toBe(
      'Herdr is not available on the server (request r-42). Start it, then retry.',
    )
    expect(await fetchWorkspaces(new AbortController().signal)).toMatchObject({
      error: { kind: 'herdr-unavailable', requestId: 'r-42' },
    })
  })

  it('gives herdr-bad-reply and internal their own kind, and status with the kind for each other kind', async () => {
    for (const { status, kind } of [
      { status: 502, kind: 'herdr-bad-reply' },
      { status: 500, kind: 'internal' },
    ]) {
      answer(errorBody(kind), status)
      expect(await fetchWorkspaces(new AbortController().signal)).toMatchObject({ error: { kind, requestId: 'r-42' } })
    }
    const bodies = [
      { status: 404, kind: 'not-found', more: { path: '/api/workspaces' } },
      { status: 400, kind: 'invalid-input', more: { issues: ['id: Required'] } },
    ]
    for (const { status, kind, more } of bodies) {
      answer(errorBody(kind, more), status)
      expect(await fetchWorkspaces(new AbortController().signal)).toMatchObject({
        error: { kind: 'status', status, errorKind: kind, requestId: 'r-42' },
      })
    }
  })

  it('gives one notice text for each kind, each saying the page shows no workspaces', async () => {
    const texts = [
      {
        body: errorBody('herdr-bad-reply'),
        status: 502,
        text: "The server could not read herdr's reply (request r-42). Check the server's log, then retry.",
      },
      { body: errorBody('forbidden'), status: 403, text: 'The server refused this device (403, request r-42).' },
      {
        body: errorBody('internal'),
        status: 500,
        text: 'The server failed while it read the workspaces (request r-42). Check its log, then retry.',
      },
      {
        body: errorBody('not-found', { path: '/api/workspaces' }),
        status: 404,
        text: 'The server answered 404 (not-found, request r-42).',
      },
    ]
    for (const { body, status, text } of texts) {
      answer(body, status)
      const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: fetchWorkspaces })
      expect(state.data.liveNotice).toEqual({ title: 'Live data unavailable — no workspaces shown', description: text })
      expect(state.data.workspaces).toEqual([])
    }
  })

  it("drops an error body's reason", async () => {
    answer(errorBody('herdr-unavailable', { reason: 'connect ENOENT herdr.sock' }), 503)
    const answered = await fetchWorkspaces(new AbortController().signal)
    expect(answered).toMatchObject({
      error: { message: 'the server answered 503: herdr is not running (herdr-unavailable, request r-42)' },
    })
    expect(JSON.stringify(answered)).not.toMatch(/herdr\.sock/)
  })

  it('names only the status and request ID of a JSON body that is not an error body', async () => {
    // The server answers every error with an error body (d-115), so a 5xx without one is a proxy's: unreachable.
    answer(JSON.stringify({ error: 'herdr is not running' }), 500, 'r-9')
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({ kind: 'unreachable', status: 500, requestId: 'r-9', message: 'the server answered 500 (request r-9)' }),
    )
    answer(JSON.stringify({ error: { kind: 'unknown-kind', message: 'x', requestId: 'r-10' } }), 500)
    expect(await fetchWorkspaces(new AbortController().signal)).toMatchObject({
      error: { kind: 'unreachable', message: 'the server answered 500' },
    })
    answer(JSON.stringify({ error: 'gone' }), 410, 'r-11')
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({
        kind: 'status',
        status: 410,
        errorKind: undefined,
        requestId: 'r-11',
        message: 'the server answered 410 (request r-11)',
      }),
    )
  })

  it('gives forbidden for a 403, as the owner check sends', async () => {
    answer(errorBody('forbidden', { message: 'not the owner' }), 403)
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({
        kind: 'forbidden',
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
    expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
      err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' }),
    )
  })

  it('gives unreachable when the connection drops while the body is read', async () => {
    const dropped = () =>
      new ReadableStream<Uint8Array>({
        start: (control) => {
          control.error(new TypeError('network error'))
        },
      })
    for (const status of [200, 502]) {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response(dropped(), { status }))),
      )
      expect(await fetchWorkspaces(new AbortController().signal)).toEqual(
        err({ kind: 'unreachable', status: undefined, requestId: undefined, message: 'the server did not answer' }),
      )
    }
  })

  it('throws, not a miss, when a 200 reply is not JSON', async () => {
    answer('<html>ok</html>', 200)
    await expect(fetchWorkspaces(new AbortController().signal)).rejects.toThrow(SyntaxError)
  })

  it('throws, not a miss, when a 200 reply does not match the contract', async () => {
    answer(JSON.stringify({ machine: 'mac-mini', workspaces: 'none' }), 200)
    await expect(fetchWorkspaces(new AbortController().signal)).rejects.toThrow()
  })
})

describe('a live read that never settles (W-3)', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

  /** A server that takes the request and never answers: fetch settles only when its signal aborts, as a real one. */
  function silentServer() {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const reason: unknown = init.signal?.reason
              reject(reason instanceof Error ? reason : new Error('aborted'))
            })
          }),
      ),
    )
  }

  /**
   * AbortSignal.timeout runs on the browser's own clock, which fake timers do not move; this one aborts with the
   * same TimeoutError from a setTimeout that they do.
   */
  function fakeTimeouts() {
    vi.useFakeTimers()
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
      const controller = new AbortController()
      setTimeout(() => {
        controller.abort(new DOMException('The operation timed out.', 'TimeoutError'))
      }, ms)
      return controller.signal
    })
  }

  it('waits 8 s', () => {
    expect(liveReadTimeoutMs).toBe(8000)
  })

  it('shows no workspaces with the timeout notice after 8 s, and not before', async () => {
    silentServer()
    fakeTimeouts()
    let done = false
    const loading = withLiveWorkspaces(workspacesHome, { fetchLayout: noLayout, client: client() }).finally(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(liveReadTimeoutMs - 1)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    const state = await loading
    expect(state.data.workspaces).toEqual([])
    expect(state.data.liveNotice).toEqual({
      title: 'Live data unavailable — no workspaces shown',
      description: 'The-bridge server took more than 8 seconds to answer. Check that it is not stuck, then retry.',
    })
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server did not answer within 8 s); the page shows no workspaces.',
    )
    expect(getReports()).toEqual([])
  })

  it('stops the read when the router aborts the load, with no notice and nothing reported', async () => {
    silentServer()
    fakeTimeouts()
    const leave = new AbortController()
    const loading = withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      signal: leave.signal,
    })
    const settled = expect(loading).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(100)
    leave.abort()
    await settled
    expect(getReports()).toEqual([])
  })

  it('keeps one read for loads that abort each other, as a burst of events reloads the page', async () => {
    let answer: ((value: Result<WorkspacesResponse, LiveMiss>) => void) | undefined
    const reads: AbortSignal[] = []
    const fetch = (read: AbortSignal) =>
      new Promise<Result<WorkspacesResponse, LiveMiss>>((resolve) => {
        reads.push(read)
        answer = resolve
      })
    const queries = client()
    const first = new AbortController()
    const firstLoad = withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: queries,
      fetch,
      signal: first.signal,
    })
    const firstEnded = expect(firstLoad).rejects.toMatchObject({ name: 'AbortError' })
    first.abort()
    await firstEnded
    const secondLoad = withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: queries,
      fetch,
      signal: new AbortController().signal,
    })
    answer?.(ok(response))
    const state = await secondLoad
    expect(reads).toHaveLength(1)
    expect(reads[0]?.aborted).toBe(false)
    expect(state.data.workspaces).toEqual(toWorkspaces(response))
  })
})

describe('an empty live list (P-3)', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const none = WorkspacesResponse.parse({ machine: 'mac-mini', workspaces: [] })

  it('shows no workspace, not a sample one, and passes the page schema', async () => {
    const state = await withLiveWorkspaces(workspacesHome, {
      fetchLayout: noLayout,
      client: client(),
      fetch: () => Promise.resolve(ok(none)),
    })
    expect(state.data.workspaces).toEqual([])
    expect(state.data.current).toBeNull()
    expect(state.data.liveNotice).toBeUndefined()
    expect(checkState(WorkspacesState, state).ok).toBe(true)
  })

  it('has a page schema that refuses a current naming no workspace, as the sample omni-brain with an empty list', () => {
    const stale = { ...workspacesHome, data: { ...workspacesHome.data, workspaces: [] } }
    expect(checkState(WorkspacesState, stale).ok).toBe(false)
    const unknown = { ...workspacesHome, data: { ...workspacesHome.data, current: 'not-a-workspace' } }
    expect(checkState(WorkspacesState, unknown).ok).toBe(false)
  })
})
