import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ChatId, MachineId, WorkspaceId } from '@bridge/contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AgentEvent } from '../services/agentPort.ts'
import { describeAgentPort } from './agentPortContract.ts'
import { type FakeHerdrSocket, startFakeHerdrSocket } from './fakeHerdrSocket.ts'
import { createHerdrAgents } from './herdrAgents.ts'
import { memoryLogger } from '../logger.ts'

const machine = MachineId.parse('test-mac')
const { log } = memoryLogger()
const projects = mkdtempSync(join(tmpdir(), 'claude-projects-'))
const cwd = '/home/dev/ncc-1701'
const home = '/home/dev'
mkdirSync(join(projects, '-home-dev-ncc-1701'))
writeFileSync(
  join(projects, '-home-dev-ncc-1701', 'session-a.jsonl'),
  [
    JSON.stringify({ type: 'user', message: { content: 'hello' } }),
    JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5' } }),
    JSON.stringify({ type: 'assistant', message: { model: '<synthetic>' } }),
    '',
  ].join('\n'),
)

// Replies as herdr 0.x (protocol 22) gives them, cut to the fields the adapter reads and a few it ignores.
const results = {
  'workspace.list': {
    type: 'workspace_list',
    workspaces: [
      {
        workspace_id: 'w17',
        label: 'the-bridge loops',
        number: 1,
        focused: true,
        agent_status: 'working',
        active_tab_id: 'w17:t1',
      },
      { workspace_id: 'w18', label: 'phone · shell', number: 2, focused: false, agent_status: 'unknown' },
    ],
  },
  'agent.list': {
    type: 'agent_list',
    agents: [
      {
        agent: 'claude',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-a' },
        agent_status: 'blocked',
        cwd,
        name: 'bridge-coord',
        pane_id: 'w17:p1',
        terminal_id: 'term_1',
        terminal_title_stripped: 'bridge-coord',
        workspace_id: 'w17',
      },
      {
        agent: 'codex',
        agent_session: null,
        agent_status: 'idle',
        cwd,
        name: 'drift',
        pane_id: 'w17:p2',
        terminal_id: 'term_2',
        terminal_title_stripped: '',
        workspace_id: 'w17',
      },
      {
        agent: 'gemini',
        agent_session: null,
        agent_status: 'working',
        pane_id: 'w18:p1',
        terminal_id: 'term_3',
        workspace_id: 'w18',
      },
    ],
  },
  // Every pane, the agents' too: w18:p2 is a shell with no agent.
  'pane.list': {
    type: 'pane_list',
    panes: [
      { pane_id: 'w17:p1', terminal_id: 'term_1', workspace_id: 'w17', agent: 'claude', agent_status: 'blocked' },
      { pane_id: 'w17:p2', terminal_id: 'term_2', workspace_id: 'w17', agent: 'codex', agent_status: 'idle' },
      {
        pane_id: 'w18:p1',
        terminal_id: 'term_3',
        workspace_id: 'w18',
        agent: 'gemini',
        agent_status: 'working',
        terminal_title_stripped: 'gemini',
      },
      {
        pane_id: 'w18:p2',
        terminal_id: 'term_5',
        workspace_id: 'w18',
        agent_status: 'unknown',
        label: 'brain git',
        terminal_title_stripped: 'dev@example:/home/dev/ncc-1701',
      },
    ],
  },
  // One tab, with the agents' two panes one above the other; herdr gives each leaf its folder too.
  'tab.list': {
    type: 'tab_list',
    tabs: [{ tab_id: 'w17:t1', workspace_id: 'w17', label: '1', number: 1, focused: true }],
  },
  'layout.export': {
    type: 'layout_export',
    layout: {
      workspace_id: 'w17',
      tab_id: 'w17:t1',
      zoomed: false,
      focused_pane_id: 'w17:p2',
      root: {
        type: 'split',
        direction: 'down',
        ratio: 0.25,
        first: { type: 'pane', pane_id: 'w17:p2', cwd },
        second: { type: 'pane', pane_id: 'w17:p1', cwd },
      },
    },
  },
  // A shell that runs a job: the foreground group is not the shell's.
  'pane.process_info': {
    type: 'pane_process_info',
    process_info: {
      pane_id: 'w18:p2',
      shell_pid: 10,
      foreground_process_group_id: 11,
      foreground_processes: [{ pid: 11, name: 'node', argv0: 'pnpm', cmdline: 'pnpm dev' }],
    },
  },
}

let socket: FakeHerdrSocket
beforeAll(async () => {
  socket = await startFakeHerdrSocket(results)
})
afterAll(() => socket.close())

const port = () => createHerdrAgents({ socket: socket.path, machine, log, claudeProjects: projects, home })

const statusLine = (pane: string, status: string) => ({
  data: { agent: 'claude', agent_status: status, pane_id: pane, workspace_id: 'w17' },
  event: 'pane.agent_status_changed',
})

describeAgentPort('herdr (recorded socket)', () =>
  Promise.resolve({
    port: port(),
    expected: {
      workspace: 'the-bridge loops',
      chat: 'bridge-coord',
      shell: { workspace: 'phone · shell', program: 'pnpm' },
    },
    setStatus: (status) => {
      socket.push(statusLine('w17:p1', status))
      return Promise.resolve()
    },
    changeLayout: () => {
      socket.push({
        event: 'tab.renamed',
        data: { type: 'tab_renamed', tab_id: 'w17:t1', workspace_id: 'w17', label: 'renamed' },
      })
      return Promise.resolve()
    },
    unreachable: createHerdrAgents({ socket: `${socket.path}.none`, machine, log, claudeProjects: projects, home }),
  }),
)

// Two panes that resumed the same Claude session, as `claude --resume` in a second pane gives.
const resumedTwice = {
  'workspace.list': results['workspace.list'],
  'pane.list': {
    type: 'pane_list',
    panes: [
      ...['term_1', 'term_4'].map((terminal_id, i) => ({
        pane_id: `w17:p${String(i + 1)}`,
        terminal_id,
        workspace_id: 'w17',
        agent: 'claude',
        agent_status: 'idle',
      })),
      { pane_id: 'w18:p2', terminal_id: 'term_5', workspace_id: 'w18', agent_status: 'unknown' },
    ],
  },
  'pane.process_info': results['pane.process_info'],
  'tab.list': results['tab.list'],
  'layout.export': results['layout.export'],
  'agent.list': {
    type: 'agent_list',
    agents: ['term_1', 'term_4'].map((terminal_id, i) => ({
      agent: 'claude',
      agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-a' },
      agent_status: 'idle',
      cwd,
      name: `bridge-coord ${String(i + 1)}`,
      pane_id: `w17:p${String(i + 1)}`,
      terminal_id,
      terminal_title_stripped: '',
      workspace_id: 'w17',
    })),
  },
}
let resumed: FakeHerdrSocket
beforeAll(async () => {
  resumed = await startFakeHerdrSocket(resumedTwice)
})
afterAll(() => resumed.close())

describeAgentPort('herdr (one session resumed in two panes)', () =>
  Promise.resolve({
    port: createHerdrAgents({ socket: resumed.path, machine, log, claudeProjects: projects, home }),
    expected: {
      workspace: 'the-bridge loops',
      chat: 'bridge-coord 2',
      shell: { workspace: 'phone · shell', program: 'pnpm' },
    },
    setStatus: (status) => {
      resumed.push(statusLine('w17:p2', status))
      return Promise.resolve()
    },
    changeLayout: () => {
      resumed.push({
        event: 'tab.renamed',
        data: { type: 'tab_renamed', tab_id: 'w17:t1', workspace_id: 'w17', label: 'renamed' },
      })
      return Promise.resolve()
    },
    unreachable: createHerdrAgents({ socket: `${resumed.path}.none`, machine, log, claudeProjects: projects, home }),
  }),
)

describe('herdr agents: a reply the adapter does not read', () => {
  let broken: FakeHerdrSocket
  beforeAll(async () => {
    broken = await startFakeHerdrSocket(results)
  })
  afterAll(() => broken.close())
  const brokenPort = () => createHerdrAgents({ socket: broken.path, machine, log, claudeProjects: projects, home })

  it('gives badReply, not unreachable, for a line that is not JSON or the reply to another request', async () => {
    for (const mode of ['garbage', 'wrongId'] as const) {
      broken.answerWith(mode)
      const read = await brokenPort().listWorkspaces()
      expect(read.ok ? undefined : read.error.reason).toBe('badReply')
    }
  })

  it('gives unreachable when herdr closes the socket before it answers', async () => {
    broken.answerWith('closeEarly')
    const read = await brokenPort().listWorkspaces()
    expect(read.ok ? undefined : read.error.reason).toBe('unreachable')
  })

  it('ends a subscription with badReply when the stream sends a line that is not JSON', async () => {
    broken.answerWith('normal')
    const ends: string[] = []
    const subscription = brokenPort().subscribe(
      () => undefined,
      (error) => ends.push(error.reason),
    )
    await subscription.ready
    broken.push('not json')
    broken.answerWith('garbage')
    for (let i = 0; i < 50 && ends.length === 0; i += 1) await new Promise((r) => setTimeout(r, 20))
    subscription.close()
    expect(ends).toEqual(['badReply'])
  })
})

describe('herdr agents', () => {
  it("maps herdr's agents to chats in the app's terms", async () => {
    const read = await port().listWorkspaces()
    expect(read).toEqual({
      ok: true,
      value: [
        {
          id: 'test-mac/w17',
          label: 'the-bridge loops',
          chats: [
            {
              id: 'test-mac/session-a',
              kind: 'claude',
              title: 'bridge-coord',
              model: 'claude-opus-5-5',
              contextUsed: null,
              status: 'needsYou',
              parent: null,
            },
            {
              id: 'test-mac/term_2',
              kind: 'codex',
              title: 'drift',
              model: null,
              contextUsed: null,
              status: 'idle',
              parent: null,
            },
          ],
        },
        {
          id: 'test-mac/w18',
          label: 'phone · shell',
          chats: [
            {
              id: 'test-mac/term_3',
              kind: 'shell',
              title: 'pnpm',
              model: 'pnpm',
              contextUsed: null,
              status: 'working',
              parent: null,
            },
            {
              id: 'test-mac/term_5',
              kind: 'shell',
              title: 'brain git',
              model: 'pnpm',
              contextUsed: null,
              status: 'unknown',
              parent: null,
            },
          ],
        },
      ],
    })
  })

  it("gives each pane of a resumed session its terminal ID, and keeps the session's model", async () => {
    const read = await createHerdrAgents({
      socket: resumed.path,
      machine,
      log,
      claudeProjects: projects,
      home,
    }).listWorkspaces()
    const chats = read.ok ? read.value[0]?.chats : undefined
    expect(chats?.map((c) => [c.id, c.model])).toEqual([
      ['test-mac/term_1', 'claude-opus-5-5'],
      ['test-mac/term_4', 'claude-opus-5-5'],
    ])
  })

  it('connects to herdr only when it is asked', async () => {
    const before = socket.connections()
    const agents = port()
    expect(socket.connections()).toBe(before)
    await agents.listWorkspaces()
    // workspace.list, agent.list, pane.list, and one pane.process_info for each of the two shells.
    expect(socket.connections()).toBe(before + 5)
  })

  it('names the socket when herdr does not answer', async () => {
    const agents = createHerdrAgents({
      socket: join(projects, 'none.sock'),
      machine,
      log,
      claudeProjects: projects,
      home,
    })
    const read = await agents.listWorkspaces()
    expect(read.ok).toBe(false)
    expect(!read.ok && read.error.reason).toBe('unreachable')
    expect(!read.ok && read.error.message).toContain('none.sock')
  })

  it('gives badReply, and does not throw, for a herdr ID that a chat or workspace ID cannot hold', async () => {
    const agent = results['agent.list'].agents[0]
    for (const reply of [
      { ...results, 'agent.list': { agents: [{ ...agent, agent_session: null, terminal_id: 'term/1' }] } },
      { ...results, 'workspace.list': { workspaces: [{ workspace_id: 'w 17', label: 'odd' }] } },
    ]) {
      const odd = await startFakeHerdrSocket(reply)
      const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects, home })
        .listWorkspaces()
        .finally(() => odd.close())
      expect(read.ok ? undefined : read.error.reason).toBe('badReply')
    }
  })

  it('shows a status herdr adds later as unknown, keeps the other chats, and logs the status once', async () => {
    const logger = memoryLogger()
    const agents = results['agent.list'].agents.map((a, i) => (i === 0 ? { ...a, agent_status: 'paused' } : a))
    const odd = await startFakeHerdrSocket({ ...results, 'agent.list': { agents } })
    const adapter = createHerdrAgents({ socket: odd.path, machine, log: logger.log, claudeProjects: projects, home })
    const first = await adapter.listWorkspaces()
    await adapter.listWorkspaces()
    await odd.close()
    if (!first.ok) throw new Error(first.error.message)
    const chats = first.value[0]?.chats ?? []
    expect(chats.map((c) => c.status)).toEqual(['unknown', 'idle'])
    expect(
      logger
        .lines()
        .filter((e) => e.msg === 'herdr status not known')
        .map((e) => e.status),
    ).toEqual(['paused'])
  })

  it("names a shell with no job by the shell's name", async () => {
    const idle = await startFakeHerdrSocket({
      ...results,
      'pane.process_info': {
        type: 'pane_process_info',
        process_info: {
          pane_id: 'w18:p2',
          shell_pid: 10,
          foreground_process_group_id: 10,
          foreground_processes: [{ pid: 10, name: 'zsh', argv0: 'zsh', argv: ['-zsh'], cmdline: '-zsh' }],
        },
      },
    })
    const read = await createHerdrAgents({ socket: idle.path, machine, log, claudeProjects: projects, home })
      .listWorkspaces()
      .finally(() => idle.close())
    const shells = read.ok ? read.value.flatMap((w) => w.chats).filter((c) => c.kind === 'shell') : []
    expect(shells.map((c) => c.model)).toEqual(['zsh', 'zsh'])
  })

  it("keeps the list, with no model, when herdr does not give a shell's processes", async () => {
    const odd = await startFakeHerdrSocket(
      Object.fromEntries(Object.entries(results).filter(([method]) => method !== 'pane.process_info')),
    )
    const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects, home })
      .listWorkspaces()
      .finally(() => odd.close())
    if (!read.ok) throw new Error(read.error.message)
    expect(read.value[1]?.chats.map((c) => [c.id, c.model])).toEqual([
      ['test-mac/term_3', null],
      ['test-mac/term_5', null],
    ])
  })

  it("maps herdr's tabs and split tree to the app's terms, with each pane's listed chat and no folder", async () => {
    const read = await port().readLayout(WorkspaceId.parse('test-mac/w17'))
    if (!read.ok) throw new Error(read.error.message)
    expect(read.value).toMatchObject({
      workspace: 'test-mac/w17',
      tabs: [
        {
          id: 'test-mac/w17:t1',
          label: '1',
          active: true,
          root: {
            kind: 'split',
            direction: 'column',
            ratio: 0.25,
            first: { kind: 'pane', chat: 'test-mac/term_2' },
            second: { kind: 'pane', chat: 'test-mac/session-a' },
          },
          focusedChat: 'test-mac/term_2',
        },
      ],
    })
    expect(read.value?.tabs[0]?.chats.map((c) => c.title)).toEqual(['drift', 'bridge-coord'])
    expect(JSON.stringify(read.value)).not.toContain(cwd)
  })

  it('reads nothing for a workspace of another machine', async () => {
    const before = socket.connections()
    const read = await port().readLayout(WorkspaceId.parse('laptop/w17'))
    expect(read).toEqual({ ok: true, value: null })
    expect(socket.connections()).toBe(before)
  })

  it('gives badReply, and does not throw, for a tree with a pane that pane.list does not list', async () => {
    const stray = { type: 'pane', pane_id: 'w17:p9' }
    const odd = await startFakeHerdrSocket({
      ...results,
      'layout.export': { layout: { ...results['layout.export'].layout, root: stray, focused_pane_id: 'w17:p9' } },
    })
    const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects, home })
      .readLayout(WorkspaceId.parse('test-mac/w17'))
      .finally(() => odd.close())
    expect(read.ok ? undefined : read.error.reason).toBe('badReply')
  })

  it('takes the tab that tab.list marks focused, else the first, when herdr gives no active tab', async () => {
    const [w17, w18] = results['workspace.list'].workspaces
    const second = { tab_id: 'w17:t2', workspace_id: 'w17', label: '2', number: 2, focused: true }
    for (const [tabs, active] of [
      [[{ ...results['tab.list'].tabs[0], focused: false }, second], ['test-mac/w17:t2']],
      [
        [{ ...second, focused: false }, results['tab.list'].tabs[0]].map((t) => ({ ...t, focused: false })),
        ['test-mac/w17:t2'],
      ],
    ] as const) {
      const odd = await startFakeHerdrSocket({
        ...results,
        'workspace.list': { workspaces: [{ ...w17, active_tab_id: undefined }, w18] },
        'tab.list': { tabs },
      })
      const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects, home })
        .readLayout(WorkspaceId.parse('test-mac/w17'))
        .finally(() => odd.close())
      if (!read.ok) throw new Error(read.error.message)
      expect(read.value?.tabs.filter((t) => t.active).map((t) => t.id)).toEqual(active)
    }
  })

  it('reads once more when a pane closed between layout.export and pane.list', async () => {
    const closing = await startFakeHerdrSocket(results)
    const layout = results['layout.export'].layout
    closing.once('layout.export', {
      layout: { ...layout, root: { ...layout.root, second: { type: 'pane', pane_id: 'w17:p9' } } },
    })
    const read = await createHerdrAgents({ socket: closing.path, machine, log, claudeProjects: projects, home })
      .readLayout(WorkspaceId.parse('test-mac/w17'))
      .finally(() => closing.close())
    expect(read.ok ? read.value?.tabs[0]?.focusedChat : read.error.message).toBe('test-mac/term_2')
  })

  it('moves a ratio of 0 or 1 just inside, so the contract holds', async () => {
    const layout = results['layout.export'].layout
    const odd = await startFakeHerdrSocket({
      ...results,
      'layout.export': { layout: { ...layout, root: { ...layout.root, ratio: 1 } } },
    })
    const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects, home })
      .readLayout(WorkspaceId.parse('test-mac/w17'))
      .finally(() => odd.close())
    const root = read.ok ? read.value?.tabs[0]?.root : undefined
    expect(root?.kind === 'split' ? root.ratio : undefined).toBe(0.99)
  })

  it('reports a reply of an unknown shape', async () => {
    const odd = await startFakeHerdrSocket({ 'workspace.list': { workspaces: 'none' }, 'agent.list': { agents: [] } })
    const read = await createHerdrAgents({
      socket: odd.path,
      machine,
      log,
      claudeProjects: projects,
      home,
    }).listWorkspaces()
    await odd.close()
    expect(!read.ok && read.error.reason).toBe('badReply')
  })
})

describe('herdr agents: subscribe', () => {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const collect = (agents = port()) => {
    const events: AgentEvent[] = []
    const ends: string[] = []
    const subscription = agents.subscribe(
      (e) => events.push(e),
      (e) => ends.push(e.message),
    )
    return { events, ends, subscription }
  }

  it("subscribes to the list events and the status of each chat's pane, shells too, on one stream", async () => {
    const { subscription } = collect()
    await subscription.ready
    expect(socket.streams()).toEqual([
      [
        { type: 'workspace.created' },
        { type: 'workspace.closed' },
        { type: 'workspace.renamed' },
        { type: 'workspace.moved' },
        { type: 'workspace.reordered' },
        { type: 'pane.created' },
        { type: 'pane.closed' },
        { type: 'pane.moved' },
        { type: 'pane.agent_detected' },
        { type: 'tab.created' },
        { type: 'tab.closed' },
        { type: 'tab.renamed' },
        { type: 'tab.moved' },
        { type: 'tab.focused' },
        { type: 'pane.focused' },
        { type: 'layout.updated' },
        { type: 'pane.agent_status_changed', pane_id: 'w17:p1' },
        { type: 'pane.agent_status_changed', pane_id: 'w17:p2' },
        { type: 'pane.agent_status_changed', pane_id: 'w18:p1' },
        { type: 'pane.agent_status_changed', pane_id: 'w18:p2' },
      ],
    ])
    subscription.close()
    await wait(50)
    expect(socket.streams()).toEqual([])
  })

  it('tells the app to read the list once the first stream starts', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    subscription.close()
    expect(events).toEqual([{ type: 'workspacesChanged' }])
  })

  it("maps herdr's blocked to needsYou, with the chat's listed ID", async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    socket.push(statusLine('w17:p2', 'blocked'))
    await wait(50)
    subscription.close()
    expect(events).toEqual([{ type: 'chatStatus', chat: 'test-mac/term_2', status: 'needsYou' }])
  })

  it("tells a shell chat's new status with the shell's listed ID", async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    socket.push({
      ...statusLine('w18:p1', 'blocked'),
      data: { ...statusLine('w18:p1', 'blocked').data, workspace_id: 'w18' },
    })
    await wait(50)
    subscription.close()
    expect(events).toEqual([{ type: 'chatStatus', chat: 'test-mac/term_3', status: 'needsYou' }])
  })

  it('opens the stream again after a burst of list events, then tells the app once', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    const before = socket.connections()
    socket.push({ event: 'pane_created', data: { type: 'pane_created', pane: { pane_id: 'w17:p9' } } })
    socket.push({ event: 'pane_agent_detected', data: { type: 'pane_agent_detected', pane_id: 'w17:p9' } })
    await wait(400)
    expect(events).toEqual([{ type: 'workspacesChanged' }])
    // One agent.list, one pane.list and one new stream; the old stream is closed.
    expect(socket.connections()).toBe(before + 3)
    expect(socket.streams()).toHaveLength(1)
    subscription.close()
  })

  it("tells one layoutChanged for a burst of one workspace's layout events, and keeps the stream", async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    const before = socket.connections()
    socket.push({ event: 'pane.focused', data: { type: 'pane_focused', pane_id: 'w17:p2', workspace_id: 'w17' } })
    socket.push({
      event: 'layout.updated',
      data: { type: 'layout_updated', layout: { workspace_id: 'w17', tab_id: 'w17:t1' } },
    })
    socket.push({ event: 'tab_created', data: { type: 'tab_created', tab: { tab_id: 'w17:t2', workspace_id: 'w17' } } })
    await wait(400)
    subscription.close()
    expect(events).toEqual([{ type: 'layoutChanged', workspace: 'test-mac/w17' }])
    expect(socket.connections()).toBe(before)
  })

  it('reads the workspace from the focus lines that herdr sends when the owner switches a tab', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    // Captured from herdr 0.x (protocol 22) on tab.focus in a session of its own.
    socket.push({ event: 'tab_focused', data: { tab_id: 'w17:t2', type: 'tab_focused', workspace_id: 'w17' } })
    socket.push({ event: 'pane_focused', data: { pane_id: 'w17:p2', type: 'pane_focused', workspace_id: 'w17' } })
    await wait(400)
    subscription.close()
    expect(events).toEqual([{ type: 'layoutChanged', workspace: 'test-mac/w17' }])
  })

  it('tells layoutChanged within 500 ms during a long burst, such as a split drag', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    const drag = { event: 'layout.updated', data: { type: 'layout_updated', layout: { workspace_id: 'w17' } } }
    let first = -1
    for (let at = 0; at < 1000; at += 50) {
      socket.push(drag)
      await wait(50)
      if (first < 0 && events.length > 0) first = at
    }
    subscription.close()
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(700)
  })

  it('treats a layout event that names no workspace as a list change', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    socket.push({ event: 'tab.focused', data: { type: 'tab_focused', tab_id: 'w17:t1' } })
    await wait(400)
    subscription.close()
    expect(events).toEqual([{ type: 'workspacesChanged' }])
  })

  it('treats a status line of an unknown pane as a list change', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    socket.push(statusLine('w17:p7', 'working'))
    await wait(400)
    subscription.close()
    expect(events).toEqual([{ type: 'workspacesChanged' }])
  })

  it('sends no shell argument or terminal title: not in the list, a status event or the log', async () => {
    // A marker in place of a token: any argument must stay in the adapter.
    const marker = 'argument-that-must-stay-here'
    const command = `curl -H 'Authorization: Bearer ${marker}' https://example.com`
    const logger = memoryLogger()
    const leaky = await startFakeHerdrSocket({
      ...results,
      'pane.list': {
        panes: [
          {
            pane_id: 'w18:p2',
            terminal_id: 'term_5',
            workspace_id: 'w18',
            agent_status: 'unknown',
            terminal_title_stripped: command,
          },
        ],
      },
      'pane.process_info': {
        process_info: {
          shell_pid: 10,
          foreground_process_group_id: 11,
          foreground_processes: [
            { pid: 11, name: 'curl', argv0: '/usr/bin/curl', cmdline: command },
            { pid: 12, name: 'jq', argv0: 'jq', cmdline: `jq --arg t ${marker} .token` },
          ],
        },
      },
    })
    const adapter = createHerdrAgents({ socket: leaky.path, machine, log: logger.log, claudeProjects: projects, home })
    const read = await adapter.listWorkspaces()
    const { events, subscription } = collect(adapter)
    await subscription.ready
    leaky.push({
      ...statusLine('w18:p2', 'blocked'),
      data: { ...statusLine('w18:p2', 'blocked').data, workspace_id: 'w18' },
    })
    await wait(50)
    subscription.close()
    await leaky.close()
    const shell = read.ok ? read.value.flatMap((w) => w.chats).find((c) => c.kind === 'shell') : undefined
    expect(shell).toMatchObject({ id: 'test-mac/term_5', title: 'curl | jq', model: 'curl | jq' })
    expect(events).toContainEqual({ type: 'chatStatus', chat: 'test-mac/term_5', status: 'needsYou' })
    expect(JSON.stringify([read, events, logger.lines()])).not.toContain(marker)
  })

  it('uses the process name when a program writes its arguments into argv0', async () => {
    const marker = 'argument-that-must-stay-here'
    const retitled = await startFakeHerdrSocket({
      ...results,
      'pane.process_info': {
        process_info: {
          shell_pid: 10,
          foreground_process_group_id: 11,
          foreground_processes: [{ pid: 11, name: 'node', argv0: `npm run dev -- --token ${marker}` }],
        },
      },
    })
    const read = await createHerdrAgents({ socket: retitled.path, machine, log, claudeProjects: projects, home })
      .listWorkspaces()
      .finally(() => retitled.close())
    const shell = read.ok ? read.value[1]?.chats.find((c) => c.id === 'test-mac/term_3') : undefined
    expect(shell).toMatchObject({ title: 'node', model: 'node' })
    expect(JSON.stringify(read)).not.toContain(marker)
  })

  it('ends the subscription once, with the reason, when herdr closes the stream', async () => {
    const { ends, subscription } = collect()
    await subscription.ready
    socket.dropStreams()
    await wait(50)
    expect(ends).toEqual(['herdr closed the events.subscribe stream'])
  })

  it('ends the subscription when herdr does not answer, and opens nothing until subscribe', async () => {
    const agents = createHerdrAgents({
      socket: join(projects, 'none.sock'),
      machine,
      log,
      claudeProjects: projects,
      home,
    })
    const { ends, subscription } = collect(agents)
    await subscription.ready
    expect(ends).toHaveLength(1)
    expect(ends[0]).toContain('none.sock')
  })
})

describe('herdr adapter transcripts', () => {
  const folder = join(projects, '-home-dev-ncc-1701')
  const secretText = 'prompt text that must stay out of logs'
  writeFileSync(
    join(folder, 'session-t.jsonl'),
    [
      { type: 'user', uuid: 'u1', message: { content: secretText } },
      {
        type: 'assistant',
        uuid: 'a1',
        message: {
          model: 'claude-opus-5-5',
          content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'pnpm test' } }],
        },
      },
    ]
      .map((l) => JSON.stringify(l))
      .join('\n'),
  )
  const agent = results['agent.list'].agents[0]
  const withAgent = (more: object) => ({ ...results, 'agent.list': { agents: [{ ...agent, ...more }] } })

  it("reads only the chat's own session, with the chat's status for a running tool, and logs no text", async () => {
    const logger = memoryLogger()
    const fake = await startFakeHerdrSocket(
      withAgent({
        agent_status: 'working',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-t' },
      }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log: logger.log, claudeProjects: projects, home })
    const read = await adapter.readTranscript(ChatId.parse('test-mac/session-t')).finally(() => fake.close())
    expect(read).toEqual({
      ok: true,
      value: {
        entries: [
          { type: 'user', id: 'u1', text: secretText, cut: false },
          { type: 'tool', id: 't1', name: 'Bash', target: 'pnpm', running: true },
        ],
        earlier: false,
      },
    })
    expect(JSON.stringify(logger.lines())).not.toContain(secretText)
  })

  it('reads no file for a session ID that could leave the projects folder', async () => {
    writeFileSync(
      join(projects, 'escape.jsonl'),
      JSON.stringify({ type: 'user', uuid: 'x1', message: { content: 'outside' } }),
    )
    const fake = await startFakeHerdrSocket(
      withAgent({ agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: '../escape' } }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    const read = await adapter.readTranscript(ChatId.parse('test-mac/term_1')).finally(() => fake.close())
    expect(read).toEqual({ ok: true, value: { entries: [], earlier: false } })
  })

  it('gives null for a chat of another machine, with no connection', async () => {
    const before = socket.connections()
    expect(await port().readTranscript(ChatId.parse('laptop/session-a'))).toEqual({ ok: true, value: null })
    expect(socket.connections()).toBe(before)
  })
})
