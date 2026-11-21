import { appendFileSync, existsSync, mkdirSync, mkdtempSync, statSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ChatId, MachineId, WorkspaceId } from '@bridge/contract'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { AgentEvent } from '../services/agentPort.ts'
import { describeAgentPort } from './agentPortContract.ts'
import { claudeScreen, type FakeHerdrSocket, paneRead, startFakeHerdrSocket } from './fakeHerdrSocket.ts'
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
  // agent.prompt answers with the agent; the adapter reads no field of either input reply.
  'agent.prompt': { type: 'agent_prompted', agent: { agent: 'claude', pane_id: 'w17:p1', agent_status: 'working' } },
  'agent.wait': { type: 'agent_info', agent: {} },
  'pane.read': paneRead('w17:p1', claudeScreen('')),
  'agent.send_keys': { type: 'ok' },
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

let appended = 0
/** Adds a prompt to session-a's file, as Claude Code would. */
const appendToSessionA = () => {
  appended += 1
  appendFileSync(
    join(projects, '-home-dev-ncc-1701', 'session-a.jsonl'),
    `\n${JSON.stringify({ type: 'user', uuid: `appended-${String(appended)}`, message: { content: 'Go on.' } })}`,
  )
  return Promise.resolve()
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

type AgentListReply = { readonly agents: readonly { readonly pane_id: string }[] }

const field = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null ? Object.getOwnPropertyDescriptor(value, name)?.value : undefined

/**
 * The suite's status and input hooks for the chat in `pane`: a status stays in the agent list, as herdr lists
 * it after a change, and `received` reads each agent.prompt text and each Escape that the pane got.
 */
function chatInPane(sock: () => FakeHerdrSocket, list: AgentListReply, pane: string) {
  // The pane's input box, as Claude Code keeps it: a stop puts the last prompt back, and ctrl+u empties it.
  let box = ''
  let last = ''
  let dropEnter = false
  // The prompts whose Enter was lost, which the chat did not get.
  const lost: string[] = []
  const show = (text: string) => {
    box = text
    sock().set('pane.read', paneRead(pane, claudeScreen(text)))
  }
  sock().onRequest((method, params) => {
    if (field(params, 'target') !== pane) return
    const keys = field(params, 'keys')
    if (method === 'agent.prompt') {
      last = String(field(params, 'text'))
      // A lost Enter: the text stays in the box.
      if (dropEnter) {
        show(last)
        lost.push(last)
      }
      dropEnter = false
    } else if (method === 'agent.send_keys' && Array.isArray(keys)) {
      if (keys.includes('esc') && box === '') show(last)
      if (keys.includes('ctrl+u')) show('')
    }
  })
  show('')
  return {
    typeInput: (text: string) => {
      show(text)
      return Promise.resolve()
    },
    clearInput: () => {
      show('')
      return Promise.resolve()
    },
    dropNextEnter: () => {
      dropEnter = true
      return Promise.resolve()
    },
    setStatus: (status: 'working' | 'idle') => {
      sock().set('agent.list', {
        ...list,
        agents: list.agents.map((a) => (a.pane_id === pane ? { ...a, agent_status: status } : a)),
      })
      sock().push(statusLine(pane, status))
      return Promise.resolve()
    },
    received: () =>
      Promise.resolve(
        sock()
          .requests()
          .filter((r) => field(r.params, 'target') === pane)
          .flatMap((r) => {
            if (r.method === 'agent.prompt') {
              const text = String(field(r.params, 'text'))
              return lost.includes(text) ? [] : [`text:${text}`]
            }
            const keys = field(r.params, 'keys')
            return r.method === 'agent.send_keys' && Array.isArray(keys)
              ? keys.map((k) => (k === 'esc' ? 'stop' : String(k)))
              : []
          }),
      ),
  }
}

describe('herdr (recorded socket)', () => {
  // Each status that the suite sets stays in the agent list until the suite ends.
  afterAll(() => {
    socket.set('agent.list', undefined)
    socket.set('pane.read', undefined)
    socket.onRequest(undefined)
  })
  describeAgentPort('herdr (recorded socket)', () => {
    socket.set('agent.list', undefined)
    return Promise.resolve({
      port: port(),
      expected: {
        workspace: 'the-bridge loops',
        chat: 'bridge-coord',
        shell: { workspace: 'phone · shell', program: 'pnpm' },
      },
      ...chatInPane(() => socket, results['agent.list'], 'w17:p1'),
      transcript: { chat: 'bridge-coord', append: appendToSessionA },
      changeLayout: () => {
        socket.push({
          event: 'tab.renamed',
          data: { type: 'tab_renamed', tab_id: 'w17:t1', workspace_id: 'w17', label: 'renamed' },
        })
        return Promise.resolve()
      },
      unreachable: createHerdrAgents({ socket: `${socket.path}.none`, machine, log, claudeProjects: projects, home }),
    })
  })
})

// Two panes that resumed the same Claude session, as `claude --resume` in a second pane gives.
const resumedTwice = {
  'workspace.list': results['workspace.list'],
  'agent.prompt': results['agent.prompt'],
  'agent.send_keys': results['agent.send_keys'],
  'agent.wait': results['agent.wait'],
  'pane.read': paneRead('w17:p2', claudeScreen('')),
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

describeAgentPort('herdr (one session resumed in two panes)', () => {
  resumed.set('agent.list', undefined)
  return Promise.resolve({
    port: createHerdrAgents({ socket: resumed.path, machine, log, claudeProjects: projects, home }),
    expected: {
      workspace: 'the-bridge loops',
      chat: 'bridge-coord 2',
      shell: { workspace: 'phone · shell', program: 'pnpm' },
    },
    ...chatInPane(() => resumed, resumedTwice['agent.list'], 'w17:p2'),
    transcript: { chat: 'bridge-coord 2', append: appendToSessionA },
    changeLayout: () => {
      resumed.push({
        event: 'tab.renamed',
        data: { type: 'tab_renamed', tab_id: 'w17:t1', workspace_id: 'w17', label: 'renamed' },
      })
      return Promise.resolve()
    },
    unreachable: createHerdrAgents({ socket: `${resumed.path}.none`, machine, log, claudeProjects: projects, home }),
  })
})

describe('herdr agents: input to a chat', () => {
  const chat = ChatId.parse('test-mac/session-a')
  const sentTo = (method: string) => socket.requests().filter((r) => r.method === method).length

  it('clears no input box of a Codex chat, whose screen the adapter does not read, and of one that waits', async () => {
    const keys = sentTo('agent.send_keys')
    expect(await port().clearInputBox(ChatId.parse('test-mac/term_2'))).toEqual({ ok: true, value: 'noCommands' })
    // The recorded list gives bridge-coord herdr's "blocked".
    expect(await port().clearInputBox(chat)).toEqual({ ok: true, value: 'needsYou' })
    expect(sentTo('agent.send_keys')).toBe(keys)
  })

  describe('a Claude Code command', () => {
    const withStatus = (status: string) => {
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: status } : a)),
      })
    }
    const prompts = () =>
      socket
        .requests()
        .filter((r) => r.method === 'agent.prompt')
        .map((r) => r.params)

    it('types /compact with its instructions on one line, and /clear, into an idle Claude chat', async () => {
      withStatus('idle')
      try {
        const compact = { command: 'compact', instructions: '  keep the plan  ' } as const
        expect(await port().sendCommand(chat, compact)).toEqual({ ok: true, value: 'sent' })
        expect(prompts().at(-1)).toEqual({ target: 'w17:p1', text: '/compact keep the plan' })
        expect(await port().sendCommand(chat, { command: 'compact' })).toEqual({ ok: true, value: 'sent' })
        expect(prompts().at(-1)).toEqual({ target: 'w17:p1', text: '/compact' })
        expect(await port().sendCommand(chat, { command: 'clear' })).toEqual({ ok: true, value: 'sent' })
        expect(prompts().at(-1)).toEqual({ target: 'w17:p1', text: '/clear' })
      } finally {
        socket.set('agent.list', undefined)
      }
    })

    it('types nothing into a chat that works, waits for the owner, is a Codex chat or holds text', async () => {
      const before = prompts().length
      // The recorded list gives bridge-coord herdr's "blocked".
      expect(await port().sendCommand(chat, { command: 'clear' })).toEqual({ ok: true, value: 'needsYou' })
      const codex = ChatId.parse('test-mac/term_2')
      expect(await port().sendCommand(codex, { command: 'clear' })).toEqual({ ok: true, value: 'noCommands' })
      withStatus('working')
      try {
        expect(await port().sendCommand(chat, { command: 'compact' })).toEqual({ ok: true, value: 'working' })
        // A state herdr does not name could be work, so it gets no command either.
        withStatus('thinking-hard')
        expect(await port().sendCommand(chat, { command: 'clear' })).toEqual({ ok: true, value: 'working' })
        withStatus('idle')
        socket.set('pane.read', paneRead('w17:p1', claudeScreen('half a thought')))
        expect(await port().sendCommand(chat, { command: 'clear' })).toEqual({ ok: true, value: 'inputNotEmpty' })
      } finally {
        socket.set('pane.read', undefined)
        socket.set('agent.list', undefined)
      }
      expect(prompts().length).toBe(before)
    })
  })

  it('sends no prompt to a chat that waits for the owner, and none when herdr says it is blocked', async () => {
    const before = sentTo('agent.prompt')
    // The recorded list gives bridge-coord herdr's "blocked".
    expect(await port().sendPrompt(chat, 'Run the tests.')).toEqual({ ok: true, value: 'needsYou' })
    expect(sentTo('agent.prompt')).toBe(before)
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
    })
    try {
      socket.failOnce('agent.prompt', 'agent_blocked', 'agent is blocked')
      expect(await port().sendPrompt(chat, 'Run the tests.')).toEqual({ ok: true, value: 'needsYou' })
    } finally {
      socket.set('agent.list', undefined)
    }
  })

  it('after a stop, keeps text in the box that is not the last prompt it sent, and the next prompt is refused', async () => {
    const list = (status: string) => ({
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: status } : a)),
    })
    const ours = port()
    socket.set('agent.list', list('idle'))
    try {
      expect(await ours.sendPrompt(chat, 'Write a long essay.')).toEqual({ ok: true, value: 'sent' })
      socket.set('agent.list', list('working'))
      // The owner typed other words in the terminal, which the box shows after the stop.
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', claudeScreen('my own words')))
      })
      const before = socket.requests().length
      expect(await ours.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      const keys = socket
        .requests()
        .slice(before)
        .filter((r) => r.method === 'agent.send_keys')
        .map((r) => field(r.params, 'keys'))
      expect(keys).toEqual([['esc']])
      socket.set('agent.list', list('idle'))
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'inputNotEmpty' })
    } finally {
      socket.onRequest(undefined)
      socket.set('pane.read', undefined)
      socket.set('agent.list', undefined)
    }
  })

  it('after a stop, keeps a draft that differs from the last prompt only in its spaces', async () => {
    const list = (status: string) => ({
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: status } : a)),
    })
    const ours = port()
    socket.set('agent.list', list('idle'))
    try {
      expect(await ours.sendPrompt(chat, 'Check every one.')).toEqual({ ok: true, value: 'sent' })
      socket.set('agent.list', list('working'))
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', claudeScreen('Check everyone.')))
      })
      const before = socket.requests().length
      expect(await ours.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      const keys = socket
        .requests()
        .slice(before)
        .filter((r) => r.method === 'agent.send_keys')
        .map((r) => field(r.params, 'keys'))
      expect(keys).toEqual([['esc']])
    } finally {
      socket.onRequest(undefined)
      socket.set('pane.read', undefined)
      socket.set('agent.list', undefined)
    }
  })

  describe('a prompt whose Enter the chat did not take', () => {
    const idle = () => {
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
      })
      socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
    }
    afterEach(() => {
      socket.onRequest(undefined)
      socket.set('pane.read', undefined)
      socket.set('agent.list', undefined)
    })

    it('answers inputNotEmpty and sends no key when the box is too long to match to the prompt', async () => {
      idle()
      const text = Array.from({ length: 20 }, (_, n) => `step ${String(n)}`).join('\n')
      socket.onRequest((method) => {
        if (method === 'agent.prompt') socket.set('pane.read', paneRead('w17:p1', claudeScreen(text)))
      })
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, text)).toEqual({ ok: true, value: 'inputNotEmpty' })
      expect(sentTo('agent.send_keys')).toBe(keys)
    })

    it('answers inputNotEmpty when its ctrl+u leaves the prompt in the box', async () => {
      idle()
      socket.onRequest((method) => {
        if (method === 'agent.prompt') socket.set('pane.read', paneRead('w17:p1', claudeScreen('Reply OK.')))
      })
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'inputNotEmpty' })
      expect(sentTo('agent.send_keys')).toBe(keys + 1)
    })
  })

  it('sends no prompt to a box that it cannot read, such as a draft with a line of "─"', async () => {
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
    })
    socket.set('pane.read', paneRead('w17:p1', claudeScreen(`notes\n${'─'.repeat(20)}\nmore notes`)))
    try {
      const before = socket.requests().filter((r) => r.method === 'agent.prompt').length
      expect(await port().sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'inputNotEmpty' })
      expect(socket.requests().filter((r) => r.method === 'agent.prompt').length).toBe(before)
    } finally {
      socket.set('pane.read', undefined)
      socket.set('agent.list', undefined)
    }
  })

  it('sends one Escape for two stops that come together or within 2 s, and one again after that', async () => {
    let time = 1_000_000
    const timed = createHerdrAgents({
      socket: socket.path,
      machine,
      log,
      claudeProjects: projects,
      home,
      now: () => time,
    })
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'working' } : a)),
    })
    try {
      const before = sentTo('agent.send_keys')
      const both = await Promise.all([timed.cancel(chat), timed.cancel(chat)])
      expect(both).toEqual([
        { ok: true, value: 'sent' },
        { ok: true, value: 'sent' },
      ])
      time += 1999
      expect(await timed.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      expect(sentTo('agent.send_keys')).toBe(before + 1)
      time += 1
      expect(await timed.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      expect(sentTo('agent.send_keys')).toBe(before + 2)
    } finally {
      socket.set('agent.list', undefined)
    }
  })

  it("gives herdr's error code without its message, which could quote the prompt", async () => {
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
    })
    try {
      socket.failOnce('agent.prompt', 'pane_busy', 'cannot paste "Deploy with token marker-1234"')
      const sent = await port().sendPrompt(chat, 'Deploy with token marker-1234')
      expect(sent).toEqual({ ok: false, error: { reason: 'badReply', message: 'herdr agent.prompt: pane_busy' } })
    } finally {
      socket.set('agent.list', undefined)
    }
  })
})

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

/** A pane ID as the adapter makes it: the machine, then 20 hex characters of a hash, with no herdr ID. */
const opaquePane: unknown = expect.stringMatching(/^test-mac\/[0-9a-f]{20}$/)

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
              modelId: 'opus',
              effort: null,
              contextUsed: null,
              status: 'needsYou',
              parent: null,
              pane: opaquePane,
            },
            {
              id: 'test-mac/term_2',
              kind: 'codex',
              title: 'drift',
              model: null,
              modelId: null,
              effort: null,
              contextUsed: null,
              status: 'idle',
              parent: null,
              pane: opaquePane,
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
              modelId: null,
              effort: null,
              contextUsed: null,
              status: 'working',
              parent: null,
              pane: opaquePane,
            },
            {
              id: 'test-mac/term_5',
              kind: 'shell',
              title: 'brain git',
              model: 'pnpm',
              modelId: null,
              effort: null,
              contextUsed: null,
              status: 'unknown',
              parent: null,
              pane: opaquePane,
            },
          ],
        },
      ],
    })
  })

  it('gives each pane its own opaque pane ID, with no herdr ID in it, that a new session keeps', async () => {
    const first = await port().listWorkspaces()
    const chats = first.ok ? first.value.flatMap((w) => w.chats) : []
    const panes = chats.map((c) => c.pane)
    expect(new Set(panes).size).toBe(4)
    for (const pane of panes) expect(pane).not.toMatch(/term_|w1[78]/)
    // After /clear, herdr shows the same terminal with a new session, so the chat ID changes and the pane ID stays.
    const [agent, ...others] = results['agent.list'].agents
    const session = { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-c' }
    const fake = await startFakeHerdrSocket({
      ...results,
      'agent.list': { agents: [{ ...agent, agent_session: session }, ...others] },
    })
    const second = await createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
      .listWorkspaces()
      .finally(() => fake.close())
    const chat = second.ok ? second.value[0]?.chats[0] : undefined
    expect(chat?.id).toBe('test-mac/session-c')
    expect(chat?.pane).toBe(chats[0]?.pane)
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

  it('reads the list again when a new session file appears beside a listed Claude session, as /clear makes', async () => {
    const listeners = new Map<string, (event: string, name: string | null) => void>()
    const folder = join(projects, '-home-dev-ncc-1701')
    const agents = createHerdrAgents({
      socket: socket.path,
      machine,
      log,
      claudeProjects: projects,
      home,
      watch: (path, listener) => {
        listeners.set(path, listener)
        return watch(path, () => undefined)
      },
    })
    const { events, subscription } = collect(agents)
    await subscription.ready
    await wait(250)
    const told = () => events.filter((e) => e.type === 'workspacesChanged').length
    const before = told()
    const tell = listeners.get(folder)
    expect(tell).toBeDefined()
    // A write to a listed session, a change event and a file that is not a session read nothing.
    tell?.('rename', 'session-a.jsonl')
    tell?.('change', 'session-new.jsonl')
    tell?.('rename', 'notes.txt')
    tell?.('rename', 'session-new')
    tell?.('rename', 'bad name.jsonl')
    await wait(250)
    expect(told()).toBe(before)
    tell?.('rename', 'session-new.jsonl')
    await wait(400)
    expect(told()).toBe(before + 1)
    await wait(1500)
    expect(told()).toBe(before + 2)
    subscription.close()
  })

  it('keeps one stream when a slow list read ends after a newer one', async () => {
    const listeners = new Map<string, (event: string, name: string | null) => void>()
    const agents = createHerdrAgents({
      socket: socket.path,
      machine,
      log,
      claudeProjects: projects,
      home,
      watch: (path, listener) => {
        listeners.set(path, listener)
        return watch(path, () => undefined)
      },
    })
    const { subscription } = collect(agents)
    await subscription.ready
    await wait(250)
    // A new session file reads the list at once and again 1.5 s later. The first read waits 2 s, so the
    // late read starts after it and ends first.
    socket.delayOnce('agent.list', 2000)
    listeners.get(join(projects, '-home-dev-ncc-1701'))?.('rename', 'session-new.jsonl')
    await wait(2600)
    expect(socket.streams()).toHaveLength(1)
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

  it("tells a transcript watcher when the chat's pane stops working, with no write to the file", async () => {
    const fake = await startFakeHerdrSocket(
      withAgent({
        agent_status: 'working',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-t' },
      }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    let changes = 0
    const watch = adapter.watchTranscript(
      ChatId.parse('test-mac/session-t'),
      () => (changes += 1),
      () => undefined,
    )
    await watch.ready
    fake.push(statusLine('w17:p1', 'idle'))
    for (const end = Date.now() + 5000; changes === 0 && Date.now() < end; ) await new Promise((r) => setTimeout(r, 20))
    watch.close()
    await fake.close()
    expect(changes).toBeGreaterThan(0)
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

  it('reads no file for a session path outside the projects folder or not a session file', async () => {
    const outside = join(projects, '..', 'outside.jsonl')
    writeFileSync(outside, JSON.stringify({ type: 'user', uuid: 'x2', message: { content: 'outside' } }))
    for (const value of [outside, join(folder, 'session-t.txt')]) {
      const fake = await startFakeHerdrSocket(
        withAgent({ agent_session: { agent: 'claude', kind: 'path', source: 'herdr:claude', value } }),
      )
      const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
      const read = await adapter.readTranscript(ChatId.parse('test-mac/term_1')).finally(() => fake.close())
      expect(read).toEqual({ ok: true, value: { entries: [], earlier: false } })
    }
    const inside = join(folder, 'session-t.jsonl')
    const fake = await startFakeHerdrSocket(
      withAgent({ agent_session: { agent: 'claude', kind: 'path', source: 'herdr:claude', value: inside } }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    const read = await adapter.readTranscript(ChatId.parse('test-mac/term_1')).finally(() => fake.close())
    expect(read.ok && read.value?.entries.map((e) => e.id)).toEqual(['u1', 't1'])
  })

  it('tells a watcher of a chat whose session folder is not there yet when the folder and the file come', async () => {
    const fake = await startFakeHerdrSocket(
      withAgent({
        cwd: '/home/dev/new-project',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-n' },
      }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    const later = join(projects, '-home-dev-new-project')
    const session = join(later, 'session-n.jsonl')
    const ends: string[] = []
    // A change that the watcher can read (the file is there when it is told), then a change for a write to the
    // file, which only a watch of the new folder sees.
    const told = new Promise<void>((resolve) => {
      let appended = false
      const watch = adapter.watchTranscript(
        ChatId.parse('test-mac/session-n'),
        () => {
          if (!existsSync(session)) return
          if (appended) {
            watch.close()
            resolve()
            return
          }
          appended = true
          appendFileSync(session, `\n${JSON.stringify({ type: 'user', uuid: 'n2', message: { content: 'more' } })}`)
        },
        (error) => ends.push(error.reason),
      )
      void watch.ready.then(() => {
        // Claude Code makes the folder and the file at once, before the watch of the projects folder can tell.
        mkdirSync(later)
        writeFileSync(session, JSON.stringify({ type: 'user', uuid: 'n1', message: { content: 'hi' } }))
        // The chat starts to work as it writes; that status change also makes the watch look for the file.
        fake.push(statusLine('w17:p1', 'working'))
      })
    })
    await told
    await fake.close()
    expect(ends).toEqual([])
  })

  it('loses no write when a folder watch loses its events, as a new one can on macOS', async () => {
    const session = join(folder, 'session-w.jsonl')
    writeFileSync(session, JSON.stringify({ type: 'user', uuid: 'w1', message: { content: 'hi' } }))
    // A watch whose folder watches tell nothing, as a macOS folder watch can as it starts; file watches tell.
    const folderDeaf = (path: string, listener: (event: string, name: string | null) => void) =>
      watch(path, (event, name) => {
        if (!statSync(path).isDirectory()) listener(event, name)
      })
    const fake = await startFakeHerdrSocket(
      withAgent({ agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-w' } }),
    )
    const adapter = createHerdrAgents({
      socket: fake.path,
      machine,
      log,
      claudeProjects: projects,
      home,
      watch: folderDeaf,
    })
    const told = new Promise<void>((resolve) => {
      const watch = adapter.watchTranscript(
        ChatId.parse('test-mac/session-w'),
        () => {
          watch.close()
          resolve()
        },
        () => undefined,
      )
      void watch.ready.then(() => {
        appendFileSync(session, `\n${JSON.stringify({ type: 'user', uuid: 'w2', message: { content: 'more' } })}`)
      })
    })
    await told
    await fake.close()
  })

  it('gives null for a chat of another machine, with no connection', async () => {
    const before = socket.connections()
    expect(await port().readTranscript(ChatId.parse('laptop/session-a'))).toEqual({ ok: true, value: null })
    expect(socket.connections()).toBe(before)
  })
})
