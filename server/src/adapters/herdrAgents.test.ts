import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MachineId } from '@bridge/contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { describeAgentPort } from './agentPortContract.ts'
import { type FakeHerdrSocket, startFakeHerdrSocket } from './fakeHerdrSocket.ts'
import { createHerdrAgents } from './herdrAgents.ts'

const machine = MachineId.parse('test-mac')
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
}

let socket: FakeHerdrSocket
beforeAll(async () => {
  socket = await startFakeHerdrSocket(results)
})
afterAll(() => socket.close())

const port = () => createHerdrAgents({ socket: socket.path, machine, claudeProjects: projects })

describeAgentPort('herdr (recorded socket)', () =>
  Promise.resolve({ port: port(), expected: { workspace: 'the-bridge loops', chat: 'bridge-coord' } }),
)

// Two panes that resumed the same Claude session, as `claude --resume` in a second pane gives.
const resumedTwice = {
  'workspace.list': results['workspace.list'],
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
    port: createHerdrAgents({ socket: resumed.path, machine, claudeProjects: projects }),
    expected: { workspace: 'the-bridge loops', chat: 'bridge-coord 2' },
  }),
)

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
        { id: 'test-mac/w18', label: 'phone · shell', chats: [] },
      ],
    })
  })

  it("gives each pane of a resumed session its terminal ID, and keeps the session's model", async () => {
    const read = await createHerdrAgents({ socket: resumed.path, machine, claudeProjects: projects }).listWorkspaces()
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
    expect(socket.connections()).toBe(before + 2)
  })

  it('names the socket when herdr does not answer', async () => {
    const agents = createHerdrAgents({ socket: join(projects, 'none.sock'), machine, claudeProjects: projects })
    const read = await agents.listWorkspaces()
    expect(read.ok).toBe(false)
    expect(!read.ok && read.error.reason).toBe('unreachable')
    expect(!read.ok && read.error.message).toContain('none.sock')
  })

  it('reports a reply of an unknown shape', async () => {
    const odd = await startFakeHerdrSocket({ 'workspace.list': { workspaces: 'none' }, 'agent.list': { agents: [] } })
    const read = await createHerdrAgents({ socket: odd.path, machine, claudeProjects: projects }).listWorkspaces()
    await odd.close()
    expect(!read.ok && read.error.reason).toBe('badReply')
  })
})
