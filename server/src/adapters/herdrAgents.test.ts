import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MachineId } from '@bridge/contract'
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
      { workspace_id: 'w17', label: 'the-bridge loops', number: 1, focused: true, agent_status: 'working' },
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
        terminal_title_stripped: 'brain git',
      },
    ],
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

const port = () => createHerdrAgents({ socket: socket.path, machine, log, claudeProjects: projects })

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
      shell: { workspace: 'phone · shell', program: 'pnpm dev' },
    },
    setStatus: (status) => {
      socket.push(statusLine('w17:p1', status))
      return Promise.resolve()
    },
    unreachable: createHerdrAgents({ socket: `${socket.path}.none`, machine, log, claudeProjects: projects }),
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
    port: createHerdrAgents({ socket: resumed.path, machine, log, claudeProjects: projects }),
    expected: {
      workspace: 'the-bridge loops',
      chat: 'bridge-coord 2',
      shell: { workspace: 'phone · shell', program: 'pnpm dev' },
    },
    setStatus: (status) => {
      resumed.push(statusLine('w17:p2', status))
      return Promise.resolve()
    },
    unreachable: createHerdrAgents({ socket: `${resumed.path}.none`, machine, log, claudeProjects: projects }),
  }),
)

describe('herdr agents: a reply the adapter does not read', () => {
  let broken: FakeHerdrSocket
  beforeAll(async () => {
    broken = await startFakeHerdrSocket(results)
  })
  afterAll(() => broken.close())
  const brokenPort = () => createHerdrAgents({ socket: broken.path, machine, log, claudeProjects: projects })

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
              title: 'gemini',
              model: 'pnpm dev',
              contextUsed: null,
              status: 'working',
              parent: null,
            },
            {
              id: 'test-mac/term_5',
              kind: 'shell',
              title: 'brain git',
              model: 'pnpm dev',
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
    const agents = createHerdrAgents({ socket: join(projects, 'none.sock'), machine, log, claudeProjects: projects })
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
      const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects })
        .listWorkspaces()
        .finally(() => odd.close())
      expect(read.ok ? undefined : read.error.reason).toBe('badReply')
    }
  })

  it('shows a status herdr adds later as unknown, keeps the other chats, and logs the status once', async () => {
    const logger = memoryLogger()
    const agents = results['agent.list'].agents.map((a, i) => (i === 0 ? { ...a, agent_status: 'paused' } : a))
    const odd = await startFakeHerdrSocket({ ...results, 'agent.list': { agents } })
    const adapter = createHerdrAgents({ socket: odd.path, machine, log: logger.log, claudeProjects: projects })
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
    const read = await createHerdrAgents({ socket: idle.path, machine, log, claudeProjects: projects })
      .listWorkspaces()
      .finally(() => idle.close())
    const shells = read.ok ? read.value.flatMap((w) => w.chats).filter((c) => c.kind === 'shell') : []
    expect(shells.map((c) => c.model)).toEqual(['zsh', 'zsh'])
  })

  it("keeps the list, with no model, when herdr does not give a shell's processes", async () => {
    const odd = await startFakeHerdrSocket(
      Object.fromEntries(Object.entries(results).filter(([method]) => method !== 'pane.process_info')),
    )
    const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects })
      .listWorkspaces()
      .finally(() => odd.close())
    if (!read.ok) throw new Error(read.error.message)
    expect(read.value[1]?.chats.map((c) => [c.id, c.model])).toEqual([
      ['test-mac/term_3', null],
      ['test-mac/term_5', null],
    ])
  })

  it('reports a reply of an unknown shape', async () => {
    const odd = await startFakeHerdrSocket({ 'workspace.list': { workspaces: 'none' }, 'agent.list': { agents: [] } })
    const read = await createHerdrAgents({ socket: odd.path, machine, log, claudeProjects: projects }).listWorkspaces()
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

  it('treats a status line of an unknown pane as a list change', async () => {
    const { events, subscription } = collect()
    await subscription.ready
    events.length = 0
    socket.push(statusLine('w17:p7', 'working'))
    await wait(400)
    subscription.close()
    expect(events).toEqual([{ type: 'workspacesChanged' }])
  })

  it('ends the subscription once, with the reason, when herdr closes the stream', async () => {
    const { ends, subscription } = collect()
    await subscription.ready
    socket.dropStreams()
    await wait(50)
    expect(ends).toEqual(['herdr closed the events.subscribe stream'])
  })

  it('ends the subscription when herdr does not answer, and opens nothing until subscribe', async () => {
    const agents = createHerdrAgents({ socket: join(projects, 'none.sock'), machine, log, claudeProjects: projects })
    const { ends, subscription } = collect(agents)
    await subscription.ready
    expect(ends).toHaveLength(1)
    expect(ends[0]).toContain('none.sock')
  })
})
