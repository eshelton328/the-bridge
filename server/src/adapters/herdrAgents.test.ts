import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  statSync,
  symlinkSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { TabId, ChatId, MachineId, type StartChatRequest, WorkspaceId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { AgentEvent, SideRunner } from '../services/agentPort.ts'
import { describeAgentPort } from './agentPortContract.ts'
import {
  claudeScreen,
  type FakeHerdrSocket,
  paneRead,
  questionScreen,
  startFakeHerdrSocket,
  switchModelScreen,
} from './fakeHerdrSocket.ts'
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
  // The layout writes; the adapter reads only a zoom's or a swap's reason.
  'pane.focus': { type: 'pane_info', pane: { pane_id: 'w17:p1' } },
  'pane.zoom': { type: 'pane_zoom', zoom: { changed: true, zoomed: true, reason: null } },
  'pane.swap': { type: 'pane_swap', swap: { changed: true, reason: null } },
  'pane.close': { type: 'ok' },
  // The edit writes; the adapter reads no field of their replies.
  'workspace.rename': { type: 'ok' },
  // A new workspace that the list does not have yet; the adapter reads only its ID.
  'workspace.create': { type: 'workspace_created', workspace: { workspace_id: 'w19', label: 'untitled' } },
  'pane.rename': { type: 'ok' },
  'workspace.move_block': { type: 'ok' },
  'workspace.close': { type: 'ok' },
  'pane.move': { type: 'pane_move', move_result: { changed: true, reason: null } },
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
  'pane.focus': results['pane.focus'],
  'pane.move': results['pane.move'],
  'workspace.create': results['workspace.create'],
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

    it('sets the effort with the effort keys on an idle chat at an empty prompt, and checks the screen', async () => {
      const marked = (level: string, text = '') =>
        claudeScreen(text).replace(/─{8,}/, (line) => `${line} ◐ ${level} · /effort ─`)
      const keys = () =>
        socket
          .requests()
          .filter((r) => r.method === 'agent.send_keys')
          .map((r) => r.params)
      withStatus('idle')
      socket.set('pane.read', paneRead('w17:p1', marked('medium')))
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', marked('xhigh')))
      })
      try {
        expect(await port().setEffort(chat, 'xhigh')).toEqual({ ok: true, value: 'set' })
        expect(keys().at(-1)).toEqual({ target: 'w17:p1', keys: ['shift+up', 'shift+up'] })
        const sent = keys().length
        expect(await port().setEffort(chat, 'low')).toEqual({ ok: true, value: 'effortNotConfirmed' })
        socket.set('pane.read', paneRead('w17:p1', marked('high', 'a draft')))
        expect(await port().setEffort(chat, 'low')).toEqual({ ok: true, value: 'inputNotEmpty' })
        withStatus('working')
        expect(await port().setEffort(chat, 'low')).toEqual({ ok: true, value: 'working' })
        expect(keys()).toHaveLength(sent + 1)
      } finally {
        socket.onRequest(undefined)
        socket.set('pane.read', undefined)
        socket.set('agent.list', undefined)
      }
    })

    it('lists the set effort until the session file changes, and tells each open list stream', async () => {
      const marked = (level: string) => claudeScreen('').replace(/─{8,}/, (line) => `${line} ◐ ${level} · /effort ─`)
      const agents = port()
      const effortIn = async () => {
        const listed = await agents.listWorkspaces()
        return listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.effort : undefined
      }
      withStatus('idle')
      const before = await effortIn()
      socket.set('pane.read', paneRead('w17:p1', marked('high')))
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', marked('xhigh')))
      })
      const events: AgentEvent[] = []
      const watch = agents.subscribe(
        (event) => events.push(event),
        () => undefined,
      )
      try {
        await watch.ready
        events.length = 0
        expect(await agents.setEffort(chat, 'xhigh')).toEqual({ ok: true, value: 'set' })
        expect(events).toContainEqual({ type: 'workspacesChanged' })
        expect(await effortIn()).toBe('xhigh')
        // The next turn writes the session file; from then on the file names the effort.
        appendFileSync(join(projects, '-home-dev-ncc-1701', 'session-a.jsonl'), 'not json\n')
        expect(await effortIn()).toBe(before)
        // A closed stream is told nothing, and its adapter keeps no hold on it.
        watch.close()
        events.length = 0
        expect(await agents.setEffort(chat, 'xhigh')).toEqual({ ok: true, value: 'set' })
        expect(events).toEqual([])
      } finally {
        watch.close()
        socket.onRequest(undefined)
        socket.set('pane.read', undefined)
        socket.set('agent.list', undefined)
      }
    })

    it('keeps the set effort of a chat that moved to another workspace, under its new pane (#435 review)', async () => {
      const marked = (level: string) => claudeScreen('').replace(/─{8,}/, (line) => `${line} ◐ ${level} · /effort ─`)
      const agents = port()
      const effortIn = async () => {
        const listed = await agents.listWorkspaces()
        return listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.effort : undefined
      }
      withStatus('idle')
      socket.set('pane.read', paneRead('w17:p1', marked('high')))
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', marked('xhigh')))
      })
      try {
        expect(await agents.setEffort(chat, 'xhigh')).toEqual({ ok: true, value: 'set' })
        socket.once('pane.move', {
          type: 'pane_move',
          move_result: { changed: true, pane: { pane_id: 'w18:p3', terminal_id: 'term_1', workspace_id: 'w18' } },
        })
        const moved = await agents.moveToWorkspace(chat, WorkspaceId.parse(`${machine}/w18`))
        expect(moved.ok && typeof moved.value === 'object').toBe(true)
        // herdr lists the pane under its new ID from now on.
        const at = <T extends { pane_id: string }>(p: T): T =>
          p.pane_id === 'w17:p1' ? { ...p, pane_id: 'w18:p3', workspace_id: 'w18' } : p
        socket.set('agent.list', {
          ...results['agent.list'],
          agents: results['agent.list'].agents.map((a) =>
            at({ ...a, agent_status: a.pane_id === 'w17:p1' ? 'idle' : a.agent_status }),
          ),
        })
        socket.set('pane.list', { ...results['pane.list'], panes: results['pane.list'].panes.map(at) })
        expect(await effortIn()).toBe('xhigh')
      } finally {
        socket.onRequest(undefined)
        socket.set('pane.read', undefined)
        socket.set('agent.list', undefined)
        socket.set('pane.list', undefined)
      }
    })

    it('lists the set effort only for its own pane when two panes resume one session', async () => {
      const marked = (level: string) => claudeScreen('').replace(/─{8,}/, (line) => `${line} ◐ ${level} · /effort ─`)
      const agents = port()
      const efforts = async () => {
        const listed = await agents.listWorkspaces()
        return listed.ok ? listed.value.flatMap((w) => w.chats).map((c) => c.effort) : []
      }
      const first = results['agent.list'].agents.find((a) => a.pane_id === 'w17:p1')
      if (first === undefined) throw new Error('no w17:p1 in the list')
      // A shared session gives each pane a new chat ID; find w17:p1's by its pane.
      const alone = await agents.listWorkspaces()
      const pane = alone.ok ? alone.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.pane : undefined
      // Another listed agent pane runs Claude and resumes the same session.
      const other = results['agent.list'].agents.find((a) => a.pane_id !== 'w17:p1')
      if (other === undefined) throw new Error('no second agent pane in the list')
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) =>
          a.pane_id === 'w17:p1'
            ? { ...a, agent_status: 'idle' }
            : a === other
              ? { ...a, agent: 'claude', agent_session: first.agent_session, cwd: first.cwd }
              : a,
        ),
      })
      socket.set('pane.read', paneRead('w17:p1', marked('high')))
      socket.onRequest((method) => {
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', marked('xhigh')))
      })
      try {
        const before = (await efforts()).filter((e) => e === 'xhigh').length
        const listed = await agents.listWorkspaces()
        const shared = listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.pane === pane)?.id : undefined
        if (shared === undefined) throw new Error('no chat for w17:p1')
        expect(await agents.setEffort(shared, 'xhigh')).toEqual({ ok: true, value: 'set' })
        expect((await efforts()).filter((e) => e === 'xhigh').length).toBe(before + 1)
      } finally {
        socket.onRequest(undefined)
        socket.set('pane.read', undefined)
        socket.set('agent.list', undefined)
      }
    })

    it('sets low only after the screen showed medium, so keys that change nothing are not set', async () => {
      const marked = (level: string) => claudeScreen('').replace(/─{8,}/, (line) => `${line} ◐ ${level} · /effort ─`)
      const keys = () =>
        socket
          .requests()
          .filter((r) => r.method === 'agent.send_keys')
          .map((r) => r.params)
      withStatus('idle')
      // CLAUDE_CODE_EFFORT_LEVEL: no mark, and the keys change nothing.
      socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      try {
        expect(await port().setEffort(chat, 'low')).toEqual({ ok: true, value: 'effortNotConfirmed' })
        const screens = [marked('medium'), claudeScreen('')]
        socket.onRequest((method) => {
          if (method === 'agent.send_keys')
            socket.set('pane.read', paneRead('w17:p1', screens.shift() ?? claudeScreen('')))
        })
        socket.set('pane.read', paneRead('w17:p1', marked('high')))
        expect(await port().setEffort(chat, 'low')).toEqual({ ok: true, value: 'set' })
        expect(keys().slice(-2)).toEqual([
          { target: 'w17:p1', keys: ['shift+down'] },
          { target: 'w17:p1', keys: ['shift+down'] },
        ])
      } finally {
        socket.onRequest(undefined)
        socket.set('pane.read', undefined)
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

  describe('a pane write', () => {
    const codex = ChatId.parse('test-mac/term_2')
    const shell = ChatId.parse('test-mac/term_5')
    const sent = (method: string) =>
      socket
        .requests()
        .filter((r) => r.method === method)
        .map((r) => r.params)
    afterEach(() => {
      socket.set('pane.list', undefined)
      socket.set('agent.list', undefined)
    })

    it('focuses and zooms the pane of a chat, a shell too', async () => {
      expect(await port().focusChat(shell)).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.focus').at(-1)).toEqual({ pane_id: 'w18:p2' })
      expect(await port().zoomChat(chat, true)).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.zoom').at(-1)).toEqual({ pane_id: 'w17:p1', mode: 'on' })
      socket.once('pane.zoom', { type: 'pane_zoom', zoom: { changed: false, reason: 'single_pane' } })
      expect(await port().zoomChat(chat, false)).toEqual({ ok: true, value: 'singlePane' })
      expect(sent('pane.zoom').at(-1)).toEqual({ pane_id: 'w17:p1', mode: 'off' })
    })

    it('swaps two panes of one tab, and none of two tabs', async () => {
      const tabs: Readonly<Record<string, string>> = { 'w17:p1': 'w17:t1', 'w17:p2': 'w17:t1' }
      socket.set('pane.list', {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => ({ ...p, tab_id: tabs[p.pane_id] ?? 'w18:t1' })),
      })
      expect(await port().swapChats(chat, codex)).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.swap').at(-1)).toEqual({ source_pane_id: 'w17:p1', target_pane_id: 'w17:p2' })
      const before = sent('pane.swap').length
      expect(await port().swapChats(chat, shell)).toEqual({ ok: true, value: 'otherTab' })
      expect(sent('pane.swap')).toHaveLength(before)
    })

    it('moves a pane to another tab of its workspace, and none to its own tab, a zoomed tab or another workspace', async () => {
      const tabs: Readonly<Record<string, string>> = { 'w17:p1': 'w17:t1', 'w17:p2': 'w17:t2' }
      socket.set('pane.list', {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => ({ ...p, tab_id: tabs[p.pane_id] ?? 'w18:t1' })),
      })
      const second = TabId.parse(`${machine}/w17:t2`)
      expect(await port().moveChat(chat, second, 'column', codex)).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.move').at(-1)).toEqual({
        pane_id: 'w17:p1',
        destination: { type: 'tab', tab_id: 'w17:t2', split: 'down', target_pane_id: 'w17:p2' },
        focus: false,
      })
      const before = sent('pane.move').length
      expect(await port().moveChat(chat, TabId.parse(`${machine}/w17:t1`), 'row')).toEqual({
        ok: true,
        value: 'sameTab',
      })
      expect(await port().moveChat(chat, TabId.parse(`${machine}/w18:t1`), 'row')).toEqual({
        ok: true,
        value: 'notFound',
      })
      expect(await port().moveChat(chat, second, 'row', shell)).toEqual({ ok: true, value: 'notFound' })
      expect(sent('pane.move')).toHaveLength(before)
      socket.set('pane.move', { type: 'pane_move', move_result: { changed: false, reason: 'zoomed_tab' } })
      expect(await port().moveChat(chat, second, 'row')).toEqual({ ok: true, value: 'zoomedTab' })
      expect(sent('pane.move').at(-1)).toMatchObject({ destination: { split: 'right' } })
      socket.set('pane.move', results['pane.move'])
    })

    it('moves a pane to a new tab of another listed workspace, and none that works, waits or is there', async () => {
      const w17 = WorkspaceId.parse(`${machine}/w17`)
      const w18 = WorkspaceId.parse(`${machine}/w18`)
      const before = sent('pane.move').length
      expect(await port().moveToWorkspace(codex, w17)).toEqual({ ok: true, value: 'sameWorkspace' })
      expect(await port().moveToWorkspace(chat, w18)).toEqual({ ok: true, value: 'needsYou' })
      socket.once('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) =>
          a.pane_id === 'w17:p2' ? { ...a, agent_status: 'working' } : a,
        ),
      })
      expect(await port().moveToWorkspace(codex, w18)).toEqual({ ok: true, value: 'working' })
      // herdr takes a workspace's number as its ID too; only a listed ID is a target.
      expect(await port().moveToWorkspace(codex, WorkspaceId.parse(`${machine}/2`))).toEqual({
        ok: true,
        value: 'notFound',
      })
      expect(await port().moveToWorkspace(codex, WorkspaceId.parse('another-mac/w18'))).toEqual({
        ok: true,
        value: 'notFound',
      })
      expect(sent('pane.move')).toHaveLength(before)
      socket.once('pane.move', {
        type: 'pane_move',
        move_result: {
          changed: true,
          closed_workspace_id: 'w17',
          pane: { pane_id: 'w18:p3', terminal_id: 'term_2', workspace_id: 'w18' },
        },
      })
      const moved = await port().moveToWorkspace(codex, w18)
      if (!moved.ok || typeof moved.value !== 'object') throw new Error('the pane did not move')
      expect(moved.value.sourceClosed).toBe(true)
      expect(moved.value.from).toBe(moved.value.to)
      const listed = await port().listWorkspaces()
      const pane = listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.id === codex)?.pane : undefined
      expect(moved.value.from).toBe(pane)
      expect(sent('pane.move').at(-1)).toEqual({
        pane_id: 'w17:p2',
        destination: { type: 'new_tab', workspace_id: 'w18' },
        focus: false,
      })
    })

    it('moves no pane whose chat starts a turn during the checks (#435 review)', async () => {
      let lists = 0
      socket.onRequest((method) => {
        if (method !== 'agent.list') return
        lists += 1
        // The chat starts to work after the first reads, before the last one.
        if (lists === 2)
          socket.set('agent.list', {
            ...results['agent.list'],
            agents: results['agent.list'].agents.map((a) =>
              a.pane_id === 'w17:p2' ? { ...a, agent_status: 'working' } : a,
            ),
          })
      })
      const before = sent('pane.move').length
      try {
        expect(await port().moveToWorkspace(codex, WorkspaceId.parse(`${machine}/w18`))).toEqual({
          ok: true,
          value: 'working',
        })
        expect(sent('pane.move')).toHaveLength(before)
      } finally {
        socket.onRequest(undefined)
        socket.set('agent.list', undefined)
      }
    })

    it("renames a workspace and a chat's pane, and lists the pane's label as the chat's title", async () => {
      expect(await port().renameWorkspace(WorkspaceId.parse(`${machine}/w17`), 'theme explorations')).toEqual({
        ok: true,
        value: 'done',
      })
      expect(sent('workspace.rename').at(-1)).toEqual({ workspace_id: 'w17', label: 'theme explorations' })
      expect(await port().renameChat(chat, 'Drift check')).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.rename').at(-1)).toEqual({ pane_id: 'w17:p1', label: 'Drift check' })
      // herdr takes a workspace's number as its ID too; the adapter renames only a listed ID.
      const renames = sent('workspace.rename').length
      for (const id of ['w99', '1'])
        expect(await port().renameWorkspace(WorkspaceId.parse(`${machine}/${id}`), 'x')).toEqual({
          ok: true,
          value: 'notFound',
        })
      expect(sent('workspace.rename')).toHaveLength(renames)
      socket.failOnce('workspace.rename', 'workspace_not_found', 'workspace w17 not found')
      expect(await port().renameWorkspace(WorkspaceId.parse(`${machine}/w17`), 'x')).toEqual({
        ok: true,
        value: 'notFound',
      })
      socket.set('pane.list', {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => (p.pane_id === 'w17:p1' ? { ...p, label: 'Drift check' } : p)),
      })
      const read = await port().listWorkspaces()
      expect(read.ok && read.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.title).toBe('Drift check')
    })

    it('closes a workspace whose panes the owner saw and none of which works, waits or runs the server', async () => {
      const w17 = WorkspaceId.parse(`${machine}/w17`)
      const w18 = WorkspaceId.parse(`${machine}/w18`)
      // w17 holds bridge-coord, which herdr gives as "blocked"; w18 a gemini pane (no chat) and a shell.
      expect(await port().closeWorkspace(w17, 2)).toEqual({ ok: true, value: 'needsYou' })
      expect(await port().closeWorkspace(w18, 3)).toEqual({ ok: true, value: 'panesChanged' })
      expect(await port().closeWorkspace(WorkspaceId.parse(`${machine}/1`), 2)).toEqual({ ok: true, value: 'notFound' })
      // The recorded shell's foreground process is pid 11: a server above it guards its workspace.
      const guarded = createHerdrAgents({
        socket: socket.path,
        machine,
        log,
        claudeProjects: projects,
        home,
        serverPids: () => Promise.resolve(new Set([11, 4242])),
      })
      expect(await guarded.closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'holdsServer' })
      // The served server and Vite both run below the coordinator's Claude (pid 11 here) in w17:p1.
      expect(await guarded.closeWorkspace(w17, 2)).toEqual({ ok: true, value: 'holdsServer' })
      // A walk of the tree that failed refuses the close.
      const unsure = createHerdrAgents({
        socket: socket.path,
        machine,
        log,
        claudeProjects: projects,
        home,
        serverPids: () => Promise.resolve(undefined),
      })
      expect(await unsure.closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'holdsServer' })
      expect(sent('workspace.close')).toHaveLength(0)
      socket.failOnce('workspace.close', 'workspace_group_close_required', 'close the group')
      expect(await port().closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'group' })
      expect(await port().closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'done' })
      expect(sent('workspace.close').at(-1)).toEqual({ workspace_id: 'w18', close_group: false })
    })

    it("never closes the coordinator's workspace, by its chat's herdr name, wherever the server runs", async () => {
      const w17 = WorkspaceId.parse(`${machine}/w17`)
      const coord = createHerdrAgents({
        socket: socket.path,
        machine,
        log,
        claudeProjects: projects,
        home,
        guardedAgents: ['bridge-coord'],
      })
      const closes = sent('workspace.close').length
      expect(await coord.closeWorkspace(w17, 2)).toEqual({ ok: true, value: 'holdsServer' })
      // With no herdr name, the pane's terminal title (Claude's session name) or its label still guards it.
      const unnamed = results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, name: null } : a))
      const panes = results['pane.list'].panes
      for (const pane of [
        { ...panes[0], terminal_title_stripped: 'bridge-coord' },
        { ...panes[0], label: 'bridge-coord' },
      ]) {
        socket.set('agent.list', { type: 'agent_list', agents: unnamed })
        socket.set('pane.list', { type: 'pane_list', panes: [pane, ...panes.slice(1)] })
        const closed = await coord.closeWorkspace(w17, 2)
        socket.set('agent.list', undefined)
        socket.set('pane.list', undefined)
        expect(closed).toEqual({ ok: true, value: 'holdsServer' })
      }
      // The app renames the coordinator's label: its terminal title, or its herdr name, still guards it.
      const agentsNow = results['agent.list'].agents
      for (const [agents, pane] of [
        [unnamed, { ...panes[0], label: 'release notes', terminal_title_stripped: 'bridge-coord' }],
        [agentsNow, { ...panes[0], label: 'release notes', terminal_title_stripped: 'release notes' }],
      ] as const) {
        socket.set('agent.list', { type: 'agent_list', agents })
        socket.set('pane.list', { type: 'pane_list', panes: [pane, ...panes.slice(1)] })
        const closed = await coord.closeWorkspace(w17, 2)
        socket.set('agent.list', undefined)
        socket.set('pane.list', undefined)
        expect(closed).toEqual({ ok: true, value: 'holdsServer' })
      }
      expect(sent('workspace.close')).toHaveLength(closes)
    })

    it('reads the lists again after the process checks: a new pane or a new turn there stops the close', async () => {
      const w18 = WorkspaceId.parse(`${machine}/w18`)
      const panes = results['pane.list'].panes
      const agents = results['agent.list'].agents
      const closes = sent('workspace.close').length
      const react = (change: () => void) => {
        socket.onRequest((method) => {
          if (method !== 'pane.process_info') return
          socket.onRequest(undefined)
          change()
        })
      }
      react(() => {
        socket.once('pane.list', {
          type: 'pane_list',
          panes: [...panes, { pane_id: 'w18:p3', terminal_id: 'term_9', workspace_id: 'w18', agent_status: 'idle' }],
        })
      })
      expect(await port().closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'panesChanged' })
      react(() => {
        socket.once('agent.list', {
          type: 'agent_list',
          agents: [
            ...agents,
            {
              agent: 'claude',
              agent_session: null,
              agent_status: 'working',
              pane_id: 'w18:p2',
              terminal_id: 'term_5',
              workspace_id: 'w18',
            },
          ],
        })
      })
      expect(await port().closeWorkspace(w18, 2)).toEqual({ ok: true, value: 'working' })
      expect(sent('workspace.close')).toHaveLength(closes)
    })

    it('orders the workspaces in one block move, and none for an order that misses or repeats one', async () => {
      const [w17, w18] = [WorkspaceId.parse(`${machine}/w17`), WorkspaceId.parse(`${machine}/w18`)]
      expect(await port().orderWorkspaces([w18, w17])).toEqual({ ok: true, value: 'done' })
      expect(sent('workspace.move_block').at(-1)).toEqual({ workspace_ids: ['w18', 'w17'], before_workspace_id: null })
      const before = sent('workspace.move_block').length
      expect(await port().orderWorkspaces([w18])).toEqual({ ok: true, value: 'stale' })
      expect(await port().orderWorkspaces([w18, w18])).toEqual({ ok: true, value: 'stale' })
      expect(await port().orderWorkspaces([w18, WorkspaceId.parse('another-machine/w17')])).toEqual({
        ok: true,
        value: 'stale',
      })
      expect(sent('workspace.move_block')).toHaveLength(before)
    })

    it('closes an idle chat or a shell, never one that waits or works, and says when the pane is gone', async () => {
      // The recorded list gives bridge-coord herdr's "blocked".
      expect(await port().closeChat(chat)).toEqual({ ok: true, value: 'needsYou' })
      const before = sent('pane.close').length
      expect(await port().closeChat(codex)).toEqual({ ok: true, value: 'done' })
      expect(sent('pane.close').slice(before)).toEqual([{ pane_id: 'w17:p2' }])
      socket.failOnce('pane.close', 'pane_not_found', 'pane w18:p2 not found')
      expect(await port().closeChat(shell)).toEqual({ ok: true, value: 'notFound' })
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) =>
          a.pane_id === 'w17:p2' ? { ...a, agent_status: 'working' } : a,
        ),
      })
      const closes = sent('pane.close').length
      expect(await port().closeChat(codex)).toEqual({ ok: true, value: 'working' })
      expect(sent('pane.close')).toHaveLength(closes)
    })

    it('splits a pane in the folder of its chat, with no focus, and gives the new shell chat', async () => {
      socket.set('pane.list', {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => (p.pane_id === 'w17:p2' ? { ...p, cwd: '/home/dev/repo' } : p)),
      })
      socket.once('pane.split', { type: 'pane_info', pane: { pane_id: 'w17:p9', terminal_id: 'term_9' } })
      expect(await port().splitChat(codex, 'column')).toEqual({ ok: true, value: { chat: 'test-mac/term_9' } })
      expect(sent('pane.split').at(-1)).toEqual({
        target_pane_id: 'w17:p2',
        direction: 'down',
        focus: false,
        cwd: '/home/dev/repo',
      })
    })

    it('sets a split ratio by its path from the root, and says when herdr has no such tab or split', async () => {
      socket.once('layout.set_split_ratio', { type: 'layout_split_ratio_set', layout: {} })
      const tab = TabId.parse('test-mac/w17:t1')
      expect(await port().setSplitRatio(tab, ['second', 'first'], 0.25)).toEqual({ ok: true, value: 'done' })
      expect(sent('layout.set_split_ratio').at(-1)).toEqual({ tab_id: 'w17:t1', path: [true, false], ratio: 0.25 })
      socket.failOnce('layout.set_split_ratio', 'split_not_found', 'split path not found')
      expect(await port().setSplitRatio(tab, ['first'], 0.5)).toEqual({ ok: true, value: 'notFound' })
      socket.failOnce('layout.set_split_ratio', 'tab_not_found', 'tab not found')
      expect(await port().setSplitRatio(tab, [], 0.5)).toEqual({ ok: true, value: 'notFound' })
    })

    it('closes nothing by the old shell ID of a pane that now runs an agent', async () => {
      // The shell of w18:p2 (term_5) started Claude, which works now.
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: [
          ...results['agent.list'].agents,
          {
            ...results['agent.list'].agents[0],
            agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-b' },
            agent_status: 'working',
            name: 'started-in-shell',
            pane_id: 'w18:p2',
            terminal_id: 'term_5',
            workspace_id: 'w18',
          },
        ],
      })
      const closes = sent('pane.close').length
      expect(await port().closeChat(shell)).toEqual({ ok: true, value: 'notFound' })
      expect(sent('pane.close')).toHaveLength(closes)
    })

    it('reads whether a tab is zoomed', async () => {
      socket.set('layout.export', {
        ...results['layout.export'],
        layout: { ...results['layout.export'].layout, zoomed: true },
      })
      try {
        const read = await port().readLayout(WorkspaceId.parse('test-mac/w17'))
        expect(read.ok && read.value?.tabs[0]?.zoomed).toBe(true)
      } finally {
        socket.set('layout.export', undefined)
      }
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

    it('does not take an empty box before the prompt shows as sent: a prompt that shows 80 ms late and stays is notSubmitted', async () => {
      idle()
      socket.onRequest((method) => {
        if (method === 'agent.prompt')
          setTimeout(() => {
            socket.set('pane.read', paneRead('w17:p1', claudeScreen('Check the lint.')))
          }, 80)
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      })
      expect(await port().sendPrompt(chat, 'Check the lint.')).toEqual({ ok: true, value: 'notSubmitted' })
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

  describe('the "Switch model?" dialog of /model', () => {
    const working = () => {
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.map((a) =>
          a.pane_id === 'w17:p1' ? { ...a, agent_status: 'working' } : a,
        ),
      })
    }
    const lastKeys = () =>
      socket
        .requests()
        .filter((r) => r.method === 'agent.send_keys')
        .at(-1)?.params
    afterEach(() => {
      socket.onRequest(undefined)
      socket.set('pane.read', undefined)
      socket.set('agent.list', undefined)
    })

    it('picks "Yes, switch" with one Enter while the chat works, and answers sent once the box shows again', async () => {
      working()
      socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      socket.onRequest((method) => {
        if (method === 'agent.prompt') socket.set('pane.read', paneRead('w17:p1', switchModelScreen()))
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      })
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, '/model sonnet')).toEqual({ ok: true, value: 'sent' })
      expect(sentTo('agent.send_keys')).toBe(keys + 1)
      expect(lastKeys()).toEqual({ target: 'w17:p1', keys: ['enter'] })
    })

    it('picks "Yes, switch" when the dialog shows 300 ms after the send', async () => {
      working()
      socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      socket.onRequest((method) => {
        if (method === 'agent.prompt')
          setTimeout(() => {
            socket.set('pane.read', paneRead('w17:p1', switchModelScreen()))
          }, 300)
        if (method === 'agent.send_keys') socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      })
      expect(await port().sendPrompt(chat, '/model sonnet')).toEqual({ ok: true, value: 'sent' })
      expect(lastKeys()).toEqual({ target: 'w17:p1', keys: ['enter'] })
    })

    it('sends no Enter when the chat only shows the words of the dialog above its input box', async () => {
      working()
      const quoted = `  Switch model?\r\n  ❯ 1. Yes, switch to Sonnet 5.5\r\n${claudeScreen('')}`
      socket.set('pane.read', paneRead('w17:p1', quoted))
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, '/model sonnet')).toEqual({ ok: true, value: 'sent' })
      expect(sentTo('agent.send_keys')).toBe(keys)
    })

    it('answers inputUnreadable when the dialog stays after its Enter', async () => {
      working()
      socket.set('pane.read', paneRead('w17:p1', claudeScreen('')))
      socket.onRequest((method) => {
        if (method === 'agent.prompt') socket.set('pane.read', paneRead('w17:p1', switchModelScreen()))
      })
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, '/model sonnet')).toEqual({ ok: true, value: 'inputUnreadable' })
      expect(sentTo('agent.send_keys')).toBe(keys + 1)
    })

    it('sends no prompt, no command and no key into an open dialog, so no Enter can pick a choice', async () => {
      working()
      socket.set('pane.read', paneRead('w17:p1', switchModelScreen()))
      const prompts = sentTo('agent.prompt')
      const keys = sentTo('agent.send_keys')
      expect(await port().sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'inputUnreadable' })
      expect(await port().sendPrompt(chat, '/effort low')).toEqual({ ok: true, value: 'inputUnreadable' })
      expect(await port().clearInputBox(chat)).toEqual({ ok: true, value: 'inputUnreadable' })
      expect(sentTo('agent.prompt')).toBe(prompts)
      expect(sentTo('agent.send_keys')).toBe(keys)
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
      expect(await port().sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'inputUnreadable' })
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

  it('logs the time of each step of a send, with no prompt text, and takes an empty box as sent after 150 ms', async () => {
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
    })
    const logger = memoryLogger()
    const timed = createHerdrAgents({ socket: socket.path, machine, log: logger.log, claudeProjects: projects, home })
    try {
      expect(await timed.sendPrompt(chat, 'Deploy with marker-5150')).toEqual({ ok: true, value: 'sent' })
      const [line] = logger.lines().filter((e) => e.msg === 'prompt sent')
      // Reads at 30, 80 and 150 ms: the box of the fake is empty at once and never shows the prompt.
      expect(line).toMatchObject({ outcome: 'sent', checkReads: 3 })
      for (const step of ['totalMs', 'locateMs', 'boxMs', 'promptMs', 'checkMs'])
        expect(typeof line?.[step]).toBe('number')
      expect(Number(line?.checkMs)).toBeGreaterThanOrEqual(150)
      expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
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

  it('subscribes again to the chats that are left when a pane closed after the list read, and ends nothing', async () => {
    socket.failOnce('events.subscribe', 'pane_not_found', 'pane w17:p9 not found')
    const before = socket.requests().filter((r) => r.method === 'events.subscribe').length
    const { ends, events, subscription } = collect()
    await subscription.ready
    await wait(50)
    expect(ends).toEqual([])
    expect(socket.requests().filter((r) => r.method === 'events.subscribe').length).toBe(before + 2)
    expect(events).toContainEqual({ type: 'workspacesChanged' })
    subscription.close()
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
          {
            type: 'tool',
            id: 't1',
            name: 'Bash',
            target: 'pnpm',
            running: true,
            kind: 'shell',
            title: 'Ran a command',
            label: '',
          },
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

  it("moves a transcript watch's status stream to the chat's new pane after a move (#435 review)", async () => {
    const fake = await startFakeHerdrSocket(
      withAgent({
        agent_status: 'idle',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-t' },
      }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    const ends: string[] = []
    const watch = adapter.watchTranscript(
      ChatId.parse('test-mac/session-t'),
      () => undefined,
      (error) => ends.push(error.reason),
    )
    await watch.ready
    const panesWatched = () => JSON.stringify(fake.streams())
    expect(panesWatched()).toContain('w17:p1')
    fake.once('pane.move', {
      type: 'pane_move',
      move_result: { changed: true, pane: { pane_id: 'w18:p3', terminal_id: 'term_1', workspace_id: 'w18' } },
    })
    const moved = await adapter.moveToWorkspace(ChatId.parse('test-mac/session-t'), WorkspaceId.parse(`${machine}/w18`))
    expect(moved.ok && typeof moved.value === 'object').toBe(true)
    for (const end = Date.now() + 5000; !panesWatched().includes('w18:p3') && Date.now() < end; )
      await new Promise((r) => setTimeout(r, 20))
    const after = panesWatched()
    watch.close()
    await fake.close()
    expect(after).toContain('w18:p3')
    expect(after).not.toContain('w17:p1')
    expect(ends).toEqual([])
  })

  it('follows a move that comes while a transcript watch starts (#435 fix review)', async () => {
    const fake = await startFakeHerdrSocket(
      withAgent({
        agent_status: 'idle',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-t' },
      }),
    )
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    // The watch's first read is slow, so the move ends first and the read still gives the old pane.
    fake.delayOnce('agent.list', 300)
    const watch = adapter.watchTranscript(
      ChatId.parse('test-mac/session-t'),
      () => undefined,
      () => undefined,
    )
    fake.once('pane.move', {
      type: 'pane_move',
      move_result: { changed: true, pane: { pane_id: 'w18:p3', terminal_id: 'term_1', workspace_id: 'w18' } },
    })
    const moved = await adapter.moveToWorkspace(ChatId.parse('test-mac/session-t'), WorkspaceId.parse(`${machine}/w18`))
    expect(moved.ok && typeof moved.value === 'object').toBe(true)
    await watch.ready
    const watched = JSON.stringify(fake.streams())
    watch.close()
    await fake.close()
    expect(watched).toContain('w18:p3')
    expect(watched).not.toContain('w17:p1')
  })

  it("keeps a transcript watch open, with no end, when the chat's pane closed before its status stream", async () => {
    const fake = await startFakeHerdrSocket(
      withAgent({
        agent_status: 'working',
        agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-t' },
      }),
    )
    fake.failOnce('events.subscribe', 'pane_not_found', 'pane w17:p1 not found')
    const adapter = createHerdrAgents({ socket: fake.path, machine, log, claudeProjects: projects, home })
    const ends: string[] = []
    const watch = adapter.watchTranscript(
      ChatId.parse('test-mac/session-t'),
      () => undefined,
      (e) => ends.push(e.reason),
    )
    await watch.ready
    await new Promise((r) => setTimeout(r, 50))
    watch.close()
    await fake.close()
    expect(ends).toEqual([])
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

describe('herdr agents: the place of a chat while a list stream is open', () => {
  const chat = ChatId.parse('test-mac/session-a')
  const idle = {
    ...results['agent.list'],
    agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
  }
  const listReads = () => socket.requests().filter((r) => r.method === 'agent.list').length
  const typed = () => socket.requests().filter((r) => r.method === 'agent.prompt').length
  const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

  it('sends a prompt with no list read while a stream is open, and reads the list for each prompt with none', async () => {
    socket.set('agent.list', idle)
    const ours = port()
    try {
      const before = listReads()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect(listReads()).toBe(before + 1)
      const stream = ours.subscribe(
        () => undefined,
        () => undefined,
      )
      await stream.ready
      const open = listReads()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect(listReads()).toBe(open)
      stream.close()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect(listReads()).toBe(open + 1)
    } finally {
      socket.set('agent.list', undefined)
    }
  })

  it('takes the status from the stream, so a chat that starts to wait gets no prompt and no list read', async () => {
    socket.set('agent.list', idle)
    const ours = port()
    const stream = ours.subscribe(
      () => undefined,
      () => undefined,
    )
    try {
      await stream.ready
      socket.push(statusLine('w17:p1', 'blocked'))
      await settle()
      const [reads, prompts] = [listReads(), typed()]
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'needsYou' })
      expect([listReads(), typed()]).toEqual([reads, prompts])
    } finally {
      stream.close()
      socket.set('agent.list', undefined)
    }
  })

  it('caches no Claude chat whose session folder the stream cannot watch, so a /clear there is not missed', async () => {
    const unwatched = {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) =>
        a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle', cwd: '/home/dev/no-such-folder' } : a,
      ),
    }
    socket.set('agent.list', unwatched)
    const ours = port()
    const stream = ours.subscribe(
      () => undefined,
      () => undefined,
    )
    try {
      await stream.ready
      const before = listReads()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect(listReads()).toBe(before + 1)
    } finally {
      stream.close()
      socket.set('agent.list', undefined)
    }
  })

  it('sends to the new pane after a pane.moved event, and finds no chat after its pane.closed', async () => {
    const at = (pane: string) => ({
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) =>
        a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle', pane_id: pane } : a,
      ),
    })
    socket.set('agent.list', idle)
    const ours = port()
    const stream = ours.subscribe(
      () => undefined,
      () => undefined,
    )
    try {
      await stream.ready
      // The chat's pane moves: herdr lists it under a new pane ID and tells the stream.
      socket.set('agent.list', at('w17:p9'))
      socket.set('pane.read', paneRead('w17:p9', claudeScreen('')))
      socket.push({ event: 'pane.moved', data: { pane_id: 'w17:p1', workspace_id: 'w17' } })
      await new Promise((resolve) => setTimeout(resolve, 400))
      const before = socket.requests().length
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      const targets = socket
        .requests()
        .slice(before)
        .filter((r) => r.method === 'agent.prompt')
        .map((r) => field(r.params, 'target'))
      expect(targets).toEqual(['w17:p9'])
      // The pane closes: the chat leaves the list, and the prompt finds no chat, with nothing typed.
      socket.set('agent.list', {
        ...results['agent.list'],
        agents: results['agent.list'].agents.filter((a) => a.pane_id !== 'w17:p1'),
      })
      socket.push({ event: 'pane.closed', data: { pane_id: 'w17:p9', workspace_id: 'w17' } })
      await new Promise((resolve) => setTimeout(resolve, 400))
      const prompts = typed()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'notFound' })
      expect(typed()).toBe(prompts)
    } finally {
      stream.close()
      socket.set('agent.list', undefined)
      socket.set('pane.read', undefined)
    }
  })

  it('keeps a status that an event gave when a second stream reads an older list', async () => {
    const blocked = {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'blocked' } : a)),
    }
    socket.set('agent.list', blocked)
    const ours = port()
    const first = ours.subscribe(
      () => undefined,
      () => undefined,
    )
    try {
      await first.ready
      socket.push(statusLine('w17:p1', 'idle'))
      await settle()
      // The second stream's read still gives the old "blocked".
      const second = ours.subscribe(
        () => undefined,
        () => undefined,
      )
      await second.ready
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      second.close()
    } finally {
      first.close()
      socket.set('agent.list', undefined)
    }
  })

  it('reads the list again after a layout event, and once more when herdr no longer knows the cached pane', async () => {
    socket.set('agent.list', idle)
    const ours = port()
    const stream = ours.subscribe(
      () => undefined,
      () => undefined,
    )
    try {
      await stream.ready
      socket.push({
        event: 'tab.renamed',
        data: { type: 'tab_renamed', tab_id: 'w17:t1', workspace_id: 'w17', label: 'x' },
      })
      await settle()
      const afterLayout = listReads()
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect(listReads()).toBe(afterLayout + 1)
      // A new stream read fills the cache again; then the box read finds the pane gone, before any text is typed.
      stream.close()
      const again = ours.subscribe(
        () => undefined,
        () => undefined,
      )
      await again.ready
      const [reads, prompts] = [listReads(), typed()]
      socket.failOnce('pane.read', 'pane_not_found', 'pane not found')
      expect(await ours.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      expect([listReads(), typed()]).toEqual([reads + 1, prompts + 1])
      again.close()
    } finally {
      stream.close()
      socket.set('agent.list', undefined)
    }
  })
})

describe('herdr agents: a new chat (slice W3)', () => {
  const root = mkdtempSync(join(tmpdir(), 'chat-root-'))
  const repo = join(root, 'repo')
  mkdirSync(repo)
  const outside = mkdtempSync(join(tmpdir(), 'outside-'))
  symlinkSync(outside, join(root, 'link'))
  const codex = ChatId.parse('test-mac/term_2')
  const withCwd = (folders: Readonly<Record<string, string>>) => ({
    ...results['pane.list'],
    panes: results['pane.list'].panes.map((p) => ({ ...p, cwd: folders[p.pane_id] })),
  })
  const newPane = { pane_id: 'w17:p9', terminal_id: 'term_9' }
  const waited = (status: string, ready = true) => ({
    type: 'agent_info',
    agent: {
      agent: 'claude',
      agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-new' },
      agent_status: status,
      interactive_ready: ready,
      cwd: repo,
      name: 'w3-test',
      pane_id: 'w17:p9',
      terminal_id: 'term_9',
      workspace_id: 'w17',
    },
  })
  const setup = async (
    { chatRoot }: { chatRoot: string | undefined } = { chatRoot: root },
    moreAgents: readonly Record<string, unknown>[] = [],
    runSide?: SideRunner,
  ) => {
    const socket = await startFakeHerdrSocket({
      ...results,
      'agent.list': { ...results['agent.list'], agents: [...results['agent.list'].agents, ...moreAgents] },
      'pane.list': withCwd({ 'w17:p1': repo, 'w17:p2': repo, 'w18:p1': join(root, 'link'), 'w18:p2': outside }),
      'pane.split': { type: 'pane_info', pane: newPane },
      'tab.create': { type: 'tab_created', tab: { tab_id: 'w17:t2' }, root_pane: newPane },
      'workspace.create': { type: 'workspace_created', workspace: { workspace_id: 'w18' }, root_pane: newPane },
      'agent.start': { type: 'agent_started', agent: { pane_id: 'w17:p9', launch_pending: true } },
      'agent.wait': waited('idle'),
    })
    const adapter = createHerdrAgents({
      socket: socket.path,
      machine,
      log: memoryLogger().log,
      claudeProjects: projects,
      home,
      ...(chatRoot === undefined ? {} : { chatRoot }),
      ...(runSide === undefined ? {} : { runSide }),
    })
    const sent = (method: string) =>
      socket
        .requests()
        .filter((r) => r.method === method)
        .map((r) => r.params)
    return { socket, adapter, sent }
  }

  it('starts Claude beside a chat in its folder, with no focus change, the name and model only, and waits for it', async () => {
    const { socket, adapter, sent } = await setup()
    const split: StartChatRequest['place'] = { in: 'split', beside: codex, direction: 'row' }
    const started = await adapter.startChat({ kind: 'claude', name: 'w3-test', model: 'sonnet', place: split })
    await socket.close()
    expect(started).toMatchObject({ ok: true, value: { chat: 'test-mac/session-new', state: 'ready' } })
    expect(started.ok && typeof started.value === 'object' ? started.value.pane : '').toMatch(
      /^test-mac\/[0-9a-f]{20}$/,
    )
    expect(sent('pane.split')).toEqual([{ target_pane_id: 'w17:p2', direction: 'right', focus: false, cwd: repo }])
    expect(sent('agent.start')).toEqual([
      {
        name: 'w3-test',
        kind: 'claude',
        pane_id: 'w17:p9',
        args: ['-n', 'w3-test', '--model', 'sonnet'],
        timeout_ms: 30000,
      },
    ])
    expect(sent('agent.wait')).toEqual([{ target: 'w17:p9', until: ['idle', 'done', 'blocked'], timeout_ms: 30000 }])
    // No focus change and no key: herdr's active pane stays, and the adapter answers nothing in the new chat.
    for (const method of ['pane.focus', 'tab.focus', 'workspace.focus', 'agent.send_keys', 'agent.prompt'])
      expect(sent(method)).toEqual([])
  })

  it("opens a new tab in the folder of the workspace's first pane, and keeps a chat that waits for the owner as needsYou", async () => {
    const { socket, adapter, sent } = await setup()
    socket.set('agent.wait', waited('blocked'))
    const started = await adapter.startChat({
      kind: 'claude',
      place: { in: 'tab', workspace: WorkspaceId.parse('test-mac/w17') },
    })
    await socket.close()
    expect(started).toMatchObject({ ok: true, value: { chat: 'test-mac/session-new', state: 'needsYou' } })
    expect(sent('tab.create')).toEqual([{ workspace_id: 'w17', cwd: repo, focus: false }])
    expect(sent('agent.start')[0]).toMatchObject({ args: ['-n', expect.stringMatching(/^chat-[0-9a-f]{6}$/)] })
    expect(sent('agent.send_keys')).toEqual([])
  })

  it('starts nothing in a folder outside the chat root, through a link or "..", with no root, or with a name in use', async () => {
    const outsideByDots = join(repo, '..', '..', basename(outside))
    const tab: StartChatRequest['place'] = { in: 'tab', workspace: WorkspaceId.parse('test-mac/w18') }
    const cases: { chatRoot: string | undefined; folders: Record<string, string>; name?: string }[] = [
      { chatRoot: root, folders: { 'w18:p1': join(root, 'link') } },
      { chatRoot: root, folders: { 'w18:p1': outsideByDots } },
      { chatRoot: undefined, folders: { 'w18:p1': repo } },
      { chatRoot: root, folders: { 'w18:p1': repo }, name: 'bridge-coord' },
    ]
    for (const { chatRoot, folders, name } of cases) {
      const { socket, adapter, sent } = await setup({ chatRoot })
      socket.set('pane.list', withCwd(folders))
      const started = await adapter.startChat({ kind: 'claude', ...(name === undefined ? {} : { name }), place: tab })
      await socket.close()
      expect(started).toEqual({ ok: true, value: name === undefined ? 'folderNotAllowed' : 'nameTaken' })
      expect([...sent('tab.create'), ...sent('agent.start')]).toEqual([])
    }
  })

  it('starts in a root of "/", tries again while the new shell is busy, and fails when the agent ends in the wait', async () => {
    const { socket, adapter, sent } = await setup({ chatRoot: '/' })
    const tab: StartChatRequest['place'] = { in: 'tab', workspace: WorkspaceId.parse('test-mac/w17') }
    socket.failOnce('agent.start', 'agent_pane_busy', 'the pane runs a command')
    expect(await adapter.startChat({ kind: 'claude', place: tab })).toMatchObject({
      ok: true,
      value: { state: 'ready' },
    })
    expect(sent('agent.start')).toHaveLength(2)
    socket.failOnce('agent.wait', 'agent_not_found', 'the agent ended')
    expect(await adapter.startChat({ kind: 'claude', place: tab })).toMatchObject({
      ok: false,
      error: { reason: 'badReply' },
    })
    await socket.close()
  })

  it('says starting when the chat is not ready in time or takes no prompt yet, and notFound for a chat or workspace it does not have', async () => {
    const { socket, adapter } = await setup()
    socket.set('agent.wait', waited('idle', false))
    const tab: StartChatRequest['place'] = { in: 'tab', workspace: WorkspaceId.parse('test-mac/w17') }
    expect(await adapter.startChat({ kind: 'claude', place: tab })).toMatchObject({ value: { state: 'starting' } })
    socket.failOnce('agent.wait', 'timeout', 'agent did not reach a settled state')
    const started = await adapter.startChat({
      kind: 'claude',
      place: { in: 'tab', workspace: WorkspaceId.parse('test-mac/w17') },
    })
    expect(started).toMatchObject({ ok: true, value: { state: 'starting' } })
    expect(started.ok && typeof started.value === 'object' ? Object.keys(started.value) : []).toEqual(['pane', 'state'])
    const gone = ChatId.parse('test-mac/term_404')
    const missing = await Promise.all([
      adapter.startChat({ kind: 'claude', place: { in: 'split', beside: gone, direction: 'row' } }),
      adapter.startChat({ kind: 'claude', place: { in: 'tab', workspace: WorkspaceId.parse('other-mac/w17') } }),
    ])
    expect(missing).toEqual([ok('notFound'), ok('notFound')])
    await socket.close()
  })

  it('forks a Claude chat beside it from a copy of its session, named "<name>-fork", and no other chat', async () => {
    const { socket, adapter, sent } = await setup()
    const forked = await adapter.forkChat(ChatId.parse('test-mac/session-a'), { direction: 'column' })
    const named = await adapter.forkChat(ChatId.parse('test-mac/session-a'), { name: 'side-copy', direction: 'row' })
    const refused = await Promise.all([
      adapter.forkChat(codex, { direction: 'row' }),
      adapter.forkChat(ChatId.parse('test-mac/term_3'), { direction: 'row' }),
      adapter.forkChat(ChatId.parse('test-mac/gone'), { direction: 'row' }),
      adapter.forkChat(ChatId.parse('other-mac/session-a'), { direction: 'row' }),
    ])
    await socket.close()
    expect(forked).toMatchObject({ ok: true, value: { chat: 'test-mac/session-new', state: 'ready' } })
    expect(named.ok).toBe(true)
    expect(sent('pane.split')[0]).toEqual({ target_pane_id: 'w17:p1', direction: 'down', focus: false, cwd: repo })
    expect(
      sent('agent.start').map((s) => (typeof s === 'object' && s !== null && 'args' in s ? s.args : null)),
    ).toEqual([
      ['-n', 'bridge-coord-fork', '--resume', 'session-a', '--fork-session'],
      ['-n', 'side-copy', '--resume', 'session-a', '--fork-session'],
    ])
    expect(refused).toEqual([ok('noSession'), ok('noSession'), ok('notFound'), ok('notFound')])
  })

  it('gives a side run the session, the folder and the record: Code Mode from the session file, the transcript on call', async () => {
    const runs: Parameters<SideRunner>[0][] = []
    const runSide: SideRunner = (run) => {
      runs.push(run)
      return (async function* () {
        yield await Promise.resolve({ end: 'done' } as const)
      })()
    }
    writeFileSync(
      join(projects, '-home-dev-ncc-1701', 'session-cm.jsonl'),
      `${[
        JSON.stringify({ type: 'repl-mode', replMode: true, sessionId: 'session-cm' }),
        JSON.stringify({ type: 'user', uuid: 'cm-1', message: { content: 'Why marker-5150?' } }),
      ].join('\n')}\n`,
    )
    const { socket, adapter } = await setup(
      { chatRoot: root },
      [
        {
          agent: 'claude',
          agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-cm' },
          agent_status: 'idle',
          cwd,
          name: 'code-mode',
          pane_id: 'w18:p3',
          terminal_id: 'term_9',
          workspace_id: 'w18',
        },
      ],
      runSide,
    )
    const signal = new AbortController().signal
    await adapter.askSide(ChatId.parse('test-mac/session-a'), 'q', signal)
    const asked = await adapter.askSide(ChatId.parse('test-mac/session-cm'), 'q', signal)
    await socket.close()
    expect(asked.ok && typeof asked.value === 'string' ? asked.value : 'run').toBe('run')
    expect(runs.map((run) => [run.session, run.record.codeMode])).toEqual([
      ['session-a', false],
      ['session-cm', true],
    ])
    expect(runs[1]?.folder).toBe(cwd)
    expect(await runs[1]?.record.text()).toBe('Owner: Why marker-5150?')
  })

  it('numbers a fork whose name is taken, and refuses a session with no saved turn, with no pane made', async () => {
    const claudeAt = (pane: string, terminal: string, name: string, session: string) => ({
      agent: 'claude',
      agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: session },
      agent_status: 'idle',
      cwd: repo,
      name,
      pane_id: pane,
      terminal_id: terminal,
      workspace_id: 'w18',
    })
    const { socket, adapter, sent } = await setup({ chatRoot: root }, [
      claudeAt('w18:p1', 'term_7', 'bridge-coord-fork', 'session-b'),
      claudeAt('w18:p2', 'term_8', 'fresh', 'session-empty'),
    ])
    const fresh = await adapter.forkChat(ChatId.parse('test-mac/session-empty'), { direction: 'row' })
    const splits = sent('pane.split').length
    const second = await adapter.forkChat(ChatId.parse('test-mac/session-a'), { direction: 'row' })
    await socket.close()
    expect([fresh, splits]).toEqual([ok('noSession'), 0])
    expect(second.ok).toBe(true)
    expect(
      sent('agent.start').map((s) => (typeof s === 'object' && s !== null && 'args' in s ? s.args : null)),
    ).toEqual([['-n', 'bridge-coord-fork-2', '--resume', 'session-a', '--fork-session']])
  })

  it('makes a workspace in the chat root with no focus, and gives it as the list does (W4)', async () => {
    const { socket, adapter, sent } = await setup()
    const made = await adapter.createWorkspace('loops').finally(() => socket.close())
    expect(sent('workspace.create')).toEqual([{ label: 'loops', focus: false, cwd: root }])
    expect(made.ok ? made.value.id : undefined).toBe(`${machine}/w18`)
    expect(made.ok ? made.value.chats.length : 0).toBeGreaterThan(0)
    const bare = await setup({ chatRoot: undefined })
    await bare.adapter.createWorkspace('loops').finally(() => bare.socket.close())
    expect(bare.sent('workspace.create')).toEqual([{ label: 'loops', focus: false }])
  })
})

describe('herdr agents: a project start (NCC-129)', () => {
  const root = '/home/dev/ncc-1701'
  const folder = `${root}/projects/example-project`
  // The folder checks are a stub: each path's real folder, so a link out of the root and a missing folder need no disk.
  const real: Readonly<Record<string, string>> = {
    [root]: root,
    [folder]: folder,
    [`${folder}/the-bridge`]: `${folder}/the-bridge`,
    [`${root}/projects/linked-out`]: '/home/dev/elsewhere',
  }
  const project = (slug: string): StartChatRequest['place'] => ({ in: 'project', project: slug })
  const newPane = { pane_id: 'w17:p9', terminal_id: 'term_9' }
  const waited = (status: string) => ({
    type: 'agent_info',
    agent: {
      agent: 'claude',
      agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: 'session-new' },
      agent_status: status,
      interactive_ready: true,
      cwd: folder,
      name: 'quick',
      pane_id: 'w17:p9',
      terminal_id: 'term_9',
      workspace_id: 'w20',
    },
  })
  const setup = async (firstPanes: Readonly<Record<string, string>>, tag: Result<void, string> = ok(undefined)) => {
    const socket = await startFakeHerdrSocket({
      ...results,
      'pane.list': {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => ({ ...p, cwd: firstPanes[p.pane_id] ?? `${folder}/the-bridge` })),
      },
      'tab.create': { type: 'tab_created', tab: { tab_id: 'w18:t2' }, root_pane: newPane },
      'workspace.create': { type: 'workspace_created', workspace: { workspace_id: 'w20' }, root_pane: newPane },
      'agent.start': { type: 'agent_started', agent: { pane_id: 'w17:p9', launch_pending: true } },
      'agent.wait': waited('idle'),
    })
    const tags: (readonly string[])[] = []
    const logged = memoryLogger()
    const adapter = createHerdrAgents({
      socket: socket.path,
      machine,
      log: logged.log,
      claudeProjects: projects,
      home,
      chatRoot: root,
      realFolder: (path) => Promise.resolve(real[path] ?? null),
      herdrCli: (args) => (tags.push(args), Promise.resolve(tag)),
    })
    const sent = (method: string) =>
      socket
        .requests()
        .filter((r) => r.method === method)
        .map((r) => r.params)
    return { socket, adapter, sent, tags, logged }
  }
  const tagArgs = ['pane', 'report-metadata', 'w17:p9', '--source', 'ncc-tags', '--token', 'project=example-project']

  it('starts nothing for a project with no folder, or whose folder is a link out of the chat root', async () => {
    const { socket, adapter, sent, tags } = await setup({})
    const refused = await Promise.all([
      adapter.startChat({ kind: 'claude', place: project('no-folder') }),
      adapter.startChat({ kind: 'claude', place: project('linked-out') }),
    ])
    await socket.close()
    expect(refused).toEqual([ok('notFound'), ok('notFound')])
    expect([...sent('workspace.create'), ...sent('tab.create'), ...sent('agent.start'), ...tags]).toEqual([])
  })

  it('opens a new tab in the workspace whose first pane is in the project folder, and tags the pane', async () => {
    const { socket, adapter, sent, tags } = await setup({ 'w18:p1': folder })
    const started = await adapter.startChat({ kind: 'claude', name: 'quick', place: project('example-project') })
    await socket.close()
    expect(started).toMatchObject({ ok: true, value: { chat: 'test-mac/session-new', state: 'ready' } })
    expect(sent('tab.create')).toEqual([{ workspace_id: 'w18', cwd: folder, focus: false }])
    expect(sent('workspace.create')).toEqual([])
    expect(tags).toEqual([tagArgs])
  })

  it('makes a workspace labelled with the slug when no first pane is in the folder, and keeps a trust prompt as needsYou', async () => {
    const { socket, adapter, sent, tags } = await setup({})
    socket.set('agent.wait', waited('blocked'))
    const started = await adapter.startChat({ kind: 'claude', name: 'quick', place: project('example-project') })
    await socket.close()
    expect(started).toMatchObject({ ok: true, value: { state: 'needsYou' } })
    expect(sent('workspace.create')).toEqual([{ label: 'example-project', cwd: folder, focus: false }])
    expect(sent('tab.create')).toEqual([])
    expect(sent('agent.start')[0]).toMatchObject({ pane_id: 'w17:p9' })
    expect(sent('agent.send_keys')).toEqual([])
    expect(tags).toEqual([tagArgs])
  })

  it('writes no tag for a start beside a chat or in a tab', async () => {
    const { socket, adapter, tags } = await setup({ 'w17:p1': root, 'w17:p2': root })
    socket.set('pane.split', { type: 'pane_info', pane: newPane })
    await adapter.startChat({ kind: 'claude', place: { in: 'tab', workspace: WorkspaceId.parse('test-mac/w17') } })
    await adapter.startChat({
      kind: 'claude',
      place: { in: 'split', beside: ChatId.parse('test-mac/term_2'), direction: 'row' },
    })
    await socket.close()
    expect(tags).toEqual([])
  })

  it('answers the chat and its state when the tag write fails, and logs only the errno code', async () => {
    const { socket, adapter, tags, logged } = await setup({ 'w18:p1': folder }, err('ENOENT'))
    const started = await adapter.startChat({ kind: 'claude', name: 'quick', place: project('example-project') })
    await socket.close()
    expect(started).toMatchObject({ ok: true, value: { chat: 'test-mac/session-new', state: 'ready' } })
    expect(tags).toEqual([tagArgs])
    const line = logged.lines().find((l) => l.msg === 'chat tags not written')
    expect(line).toMatchObject({ code: 'ENOENT' })
    expect(JSON.stringify(line)).not.toMatch(/example-project|\/home\/dev|w17:p9/)
  })
})

describe('herdr agents: a model restart', () => {
  const session = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'
  const chat = ChatId.parse(`${machine}/${session}`)
  const claudeAgent = (status: string, extra: Record<string, unknown> = {}) => ({
    agent: 'claude',
    agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: session },
    agent_status: status,
    cwd,
    name: 'marker-5150',
    pane_id: 'w17:p1',
    terminal_id: 'term_1',
    workspace_id: 'w17',
    ...extra,
  })
  const processes = (claude: boolean, argv: string[] = [], launchCwd = cwd) => ({
    type: 'pane_process_info',
    process_info: {
      shell_pid: 10,
      foreground_process_group_id: claude ? 11 : 10,
      foreground_processes: claude
        ? [{ pid: 11, name: '2.1.330', argv0: 'claude', argv, cwd: launchCwd }]
        : [{ pid: 10, name: 'zsh', argv: ['-zsh'], cwd }],
    },
  })
  const setup = async (line: string, launchCwd = cwd, resumed = session) => {
    // A herdr that still holds the agent's name until a list read after the exit.
    let ended = false
    const socket = await startFakeHerdrSocket({
      ...results,
      'agent.list': { type: 'agent_list', agents: [claudeAgent('idle')] },
      'pane.read': paneRead('w17:p1', claudeScreen('')),
      'pane.process_info': processes(true, line.split(' '), launchCwd),
      'agent.start': { type: 'agent_started', agent: { pane_id: 'w17:p1', launch_pending: true } },
      'agent.wait': {
        type: 'agent_info',
        agent: claudeAgent('idle', {
          interactive_ready: true,
          agent_session: { agent: 'claude', kind: 'id', source: 'herdr:claude', value: resumed },
        }),
      },
    })
    socket.onRequest((method) => {
      if (method === 'agent.send_keys') {
        socket.set('pane.process_info', processes(false))
        ended = true
      } else if (method === 'agent.list' && ended) socket.set('agent.list', { type: 'agent_list', agents: [] })
      else if (method === 'agent.start') {
        ended = false
        socket.set('agent.list', { type: 'agent_list', agents: [claudeAgent('idle')] })
      }
    })
    const adapter = createHerdrAgents({
      socket: socket.path,
      machine,
      log: memoryLogger().log,
      claudeProjects: projects,
      home,
    })
    const sent = (method: string) =>
      socket
        .requests()
        .filter((r) => r.method === method)
        .map((r) => r.params)
    return { socket, adapter, sent }
  }

  it('ends the chat with ctrl+c and starts it again in its pane with its flags, the session and the model', async () => {
    const { socket, adapter, sent } = await setup('claude --permission-mode acceptEdits --model sonnet --chrome')
    const restarted = await adapter.restartModel(chat, 'opus')
    // The session file names the old model until the next turn; the list gives the new one.
    const listed = await adapter.listWorkspaces()
    const again = await adapter.restartModel(chat, 'opus')
    await socket.close()
    expect(restarted).toEqual({ ok: true, value: { state: 'ready', chat } })
    expect(listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.modelId : null).toBe('opus')
    expect(again).toEqual({ ok: true, value: 'sameModel' })
    expect(sent('agent.send_keys')).toEqual([{ target: 'w17:p1', keys: ['ctrl+c', 'ctrl+c'] }])
    expect(sent('agent.start')).toEqual([
      {
        name: 'marker-5150',
        kind: 'claude',
        pane_id: 'w17:p1',
        args: [
          '--permission-mode',
          'acceptEdits',
          '--chrome',
          '-n',
          'marker-5150',
          '--resume',
          session,
          '--model',
          'opus',
        ],
        timeout_ms: 30_000,
      },
    ])
  })

  it('sends no key for a command line that skips a permission or has an unknown token, or another folder', async () => {
    for (const [line, launchCwd, outcome] of [
      ['claude --dangerously-skip-permissions', cwd, 'skipsPermissions'],
      ['claude --permission-mode bypassPermissions', cwd, 'skipsPermissions'],
      ['claude --debug', cwd, 'launchArgsUnknown'],
      ['claude', '/home/dev/other', 'folderChanged'],
    ]) {
      const { socket, adapter, sent } = await setup(line ?? '', launchCwd)
      expect(await adapter.restartModel(chat, 'opus')).toEqual({ ok: true, value: outcome })
      expect(sent('agent.send_keys')).toEqual([])
      await socket.close()
    }
  })

  it('restarts nothing when the pane has another session at the readiness read (a /clear)', async () => {
    const { socket, adapter, sent } = await setup('claude')
    let lists = 0
    socket.onRequest((method) => {
      if (method !== 'agent.list') return
      lists += 1
      const other = {
        agent: 'claude',
        kind: 'id',
        source: 'herdr:claude',
        value: '1c8a3d2f-5e4b-4a7c-8b9d-2f3e4d5c6b7a',
      }
      // The lookup reads the list first; the readiness read is the second read.
      if (lists === 2)
        socket.set('agent.list', { type: 'agent_list', agents: [claudeAgent('idle', { agent_session: other })] })
    })
    const restarted = await adapter.restartModel(chat, 'opus')
    await socket.close()
    expect(restarted).toEqual({ ok: true, value: 'notFound' })
    expect(sent('agent.send_keys')).toEqual([])
  })

  it('lists the new model when the new chat is still starting after the wait', async () => {
    const { socket, adapter } = await setup('claude')
    socket.failOnce('agent.wait', 'timeout', 'the agent did not settle')
    const restarted = await adapter.restartModel(chat, 'opus')
    const listed = await adapter.listWorkspaces()
    await socket.close()
    expect(restarted).toEqual({ ok: true, value: { state: 'starting', chat } })
    expect(listed.ok ? listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)?.modelId : null).toBe('opus')
  })

  it('answers failed with the session when the new chat has another session, and starts no second chat', async () => {
    const other = '1c8a3d2f-5e4b-4a7c-8b9d-2f3e4d5c6b7a'
    const { socket, adapter, sent } = await setup('claude', cwd, other)
    const restarted = await adapter.restartModel(chat, 'opus')
    await socket.close()
    expect(restarted).toEqual({ ok: true, value: { state: 'failed', session } })
    expect(sent('agent.start')).toHaveLength(1)
  })
})

describe('herdr agents: project workspaces (R49)', () => {
  const root = mkdtempSync(join(tmpdir(), 'chat-root-'))
  mkdirSync(join(root, 'projects', 'alpha', 'repo'), { recursive: true })
  const outside = mkdtempSync(join(tmpdir(), 'outside-'))
  const read = async (folders: Readonly<Record<string, string>>, chatRoot: string | null = root) => {
    const socket = await startFakeHerdrSocket({
      ...results,
      'pane.list': {
        ...results['pane.list'],
        panes: results['pane.list'].panes.map((p) => ({ ...p, cwd: folders[p.pane_id] })),
      },
    })
    const adapter = createHerdrAgents({
      socket: socket.path,
      machine,
      log: memoryLogger().log,
      claudeProjects: projects,
      home,
      ...(chatRoot === null ? {} : { chatRoot }),
    })
    const found = await adapter.projectWorkspaces()
    await socket.close()
    return found.ok ? Object.fromEntries(found.value) : found
  }

  it('maps a project to the first workspace with a pane in its folder, and gives no path', async () => {
    const alpha = join(root, 'projects', 'alpha', 'repo')
    expect(await read({ 'w17:p1': alpha, 'w18:p1': outside })).toEqual({ alpha: 'test-mac/w17' })
    expect(await read({ 'w17:p1': outside, 'w17:p2': alpha, 'w18:p1': alpha })).toEqual({ alpha: 'test-mac/w17' })
    expect(await read({ 'w17:p1': outside, 'w17:p2': outside, 'w18:p1': alpha })).toEqual({ alpha: 'test-mac/w18' })
    expect(await read({ 'w17:p1': join(root, 'projects') })).toEqual({})
    expect(await read({ 'w17:p1': alpha }, null)).toEqual({})
  })
})

describe('herdr agents: a dialog on a chat that waits (R69)', () => {
  // The recorded list gives this chat herdr's "blocked".
  const chat = ChatId.parse('test-mac/session-a')
  const reads = () => socket.requests().filter((r) => r.method === 'pane.read').length
  const keys = () => socket.requests().filter((r) => r.method === 'agent.send_keys')
  afterEach(() => {
    socket.set('pane.read', undefined)
    socket.set('agent.list', undefined)
  })

  it('reads the dialog and moves to the tapped option before its Enter', async () => {
    socket.set('pane.read', paneRead('w17:p1', questionScreen(1)))
    const read = await port().readDialog(chat)
    const dialog = read.ok && read.value !== null && typeof read.value === 'object' ? read.value : undefined
    expect(dialog?.options?.map((o) => o.n)).toEqual([1, 2, 3])
    const sent = keys().length
    expect(await port().answerDialog(chat, { id: dialog?.id ?? '', n: 3 })).toEqual({ ok: true, value: 'sent' })
    expect(
      keys()
        .slice(sent)
        .map((r) => r.params),
    ).toEqual([{ target: 'w17:p1', keys: ['down', 'down', 'enter'] }])
  })

  it('sends no key when the screen shows another dialog or the option is not offered', async () => {
    socket.set('pane.read', paneRead('w17:p1', questionScreen(1)))
    const read = await port().readDialog(chat)
    const id = read.ok && read.value !== null && typeof read.value === 'object' ? read.value.id : ''
    const sent = keys().length
    expect(await port().answerDialog(chat, { id, n: 4 })).toEqual({ ok: true, value: 'dialogChanged' })
    socket.set('pane.read', paneRead('w17:p1', questionScreen(2)))
    expect(await port().answerDialog(chat, { id, n: 1 })).toEqual({ ok: true, value: 'dialogChanged' })
    expect(keys().length).toBe(sent)
  })

  it('answers a dialog once when two answers to it come at the same time or one after the other', async () => {
    socket.set('pane.read', paneRead('w17:p1', questionScreen(1)))
    const ours = port()
    const read = await ours.readDialog(chat)
    const id = read.ok && read.value !== null && typeof read.value === 'object' ? read.value.id : ''
    const sent = keys().length
    const both = await Promise.all([ours.answerDialog(chat, { id, n: 2 }), ours.answerDialog(chat, { id, n: 3 })])
    expect(both.map((r) => (r.ok ? r.value : r.error.reason)).sort()).toEqual(['dialogChanged', 'sent'])
    expect(await ours.answerDialog(chat, { id, n: 2 })).toEqual({ ok: true, value: 'dialogChanged' })
    expect(keys().length).toBe(sent + 1)
  })

  it('reads no screen of a chat that does not wait, and none of a Codex chat', async () => {
    socket.set('agent.list', {
      ...results['agent.list'],
      agents: results['agent.list'].agents.map((a) => (a.pane_id === 'w17:p1' ? { ...a, agent_status: 'idle' } : a)),
    })
    const before = reads()
    expect(await port().readDialog(chat)).toEqual({ ok: true, value: null })
    expect(await port().answerDialog(chat, { id: 'a1b2c3d4e5f60718', n: 1 })).toEqual({
      ok: true,
      value: 'dialogChanged',
    })
    expect(await port().readDialog(ChatId.parse('test-mac/term_2'))).toEqual({ ok: true, value: 'noCommands' })
    expect(reads()).toBe(before)
  })
})
