// The one contract test suite of the AgentPort (d-113). Every adapter runs
// it, the fake and herdr's, so the fake cannot drift from what it stands for.
import {
  ChatSkill,
  ChatId,
  type ChatStatus,
  chatsOf,
  splitId,
  TabId,
  TranscriptEntry,
  WorkspaceId,
  WorkspaceLayout,
  WorkspaceSummary,
} from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { AgentEvent, AgentPort } from '../services/agentPort.ts'

export type ContractSetup = {
  readonly port: AgentPort
  /**
   * A workspace the adapter must list, and the title of a chat in it; and a workspace with a shell pane, and the
   * program that shell runs.
   */
  readonly expected: {
    readonly workspace: string
    readonly chat: string
    readonly shell: { readonly workspace: string; readonly program: string }
  }
  /** Gives the expected chat `status` (`working` or `idle`), as its agent would. */
  readonly setStatus: (status: 'working' | 'idle') => Promise<void>
  /** Changes the layout of the expected workspace (such as a tab's name), as the owner would in herdr. */
  readonly changeLayout: () => Promise<void>
  /** A chat that has a transcript (its title), and a function that adds an entry to it, as its agent would. */
  readonly transcript: { readonly chat: string; readonly append: () => Promise<void> }
  /**
   * What the expected chat got from the owner, in order: `text:<prompt>` for each prompt it got as typed and sent,
   * and `stop` for each Escape.
   */
  readonly received: () => Promise<string[]>
  /** Puts `text` in the expected chat's input box without sending it, as the owner typing in its terminal. */
  readonly typeInput: (text: string) => Promise<void>
  /** Empties the expected chat's input box, as the owner would. */
  readonly clearInput: () => Promise<void>
  /** The expected chat's next prompt gets its text but not its Enter, so the text stays in its box. */
  readonly dropNextEnter: () => Promise<void>
  /** A port of the same adapter whose agents do not answer, such as one on a socket that is not there. */
  readonly unreachable: AgentPort
}

/** Waits up to `ms` for `check` to pass. */
async function until(what: string, check: () => boolean, ms = 5000): Promise<void> {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 20))) if (check()) return
  throw new Error(`${what} did not happen in ${String(ms)} ms`)
}

/** Waits up to `ms` for an async `check` to pass. */
async function untilAsync(what: string, check: () => Promise<boolean>, ms = 5000): Promise<void> {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 20)))
    if (await check()) return
  throw new Error(`${what} did not happen in ${String(ms)} ms`)
}

/** The listed IDs of the expected chat and of a shell chat. */
async function chatsToUse(port: AgentPort, expected: ContractSetup['expected']) {
  const read = await port.listWorkspaces()
  if (!read.ok) throw new Error(read.error.message)
  const chats = read.value.flatMap((w) => w.chats)
  const chat = chats.find((c) => c.title === expected.chat)
  const shell = read.value.find((w) => w.label === expected.shell.workspace)?.chats.find((c) => c.kind === 'shell')
  if (chat === undefined || shell === undefined) throw new Error('the expected chat or shell is not listed')
  return { chat: chat.id, shell: shell.id }
}

/** Waits until the list shows the expected chat with `status`, as the adapter reads it before an input. */
async function statusShown(port: AgentPort, expected: ContractSetup['expected'], status: ChatStatus) {
  await untilAsync(`the chat's status ${status}`, async () => {
    const read = await port.listWorkspaces()
    return read.ok && read.value.some((w) => w.chats.some((c) => c.title === expected.chat && c.status === status))
  })
}

export function describeAgentPort(name: string, setup: () => Promise<ContractSetup>): void {
  describe(`AgentPort contract: ${name}`, () => {
    it('sends a prompt to a chat, which gets its text as typed and sent', async () => {
      const { port, expected, setStatus, received } = await setup()
      const { chat } = await chatsToUse(port, expected)
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      const sent = await port.sendPrompt(chat, 'Run the tests.')
      expect(sent).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the prompt to arrive', async () => (await received()).includes('text:Run the tests.'))
    })

    it('maps a project only to a workspace that the list has (R49)', async () => {
      const { port } = await setup()
      const [projects, read] = await Promise.all([port.projectWorkspaces(), port.listWorkspaces()])
      if (!projects.ok || !read.ok) throw new Error('the reads failed')
      const listed = new Set(read.value.map((w) => w.id))
      for (const workspace of projects.value.values()) expect(listed.has(workspace)).toBe(true)
    })

    it('sends nothing to a shell chat or to a chat that the machine does not have', async () => {
      const { port, expected } = await setup()
      const { shell } = await chatsToUse(port, expected)
      const none = ChatId.parse(`${port.machine}/no-such-chat`)
      expect(await port.sendPrompt(shell, 'ls')).toEqual({ ok: true, value: 'shell' })
      expect(await port.cancel(shell)).toEqual({ ok: true, value: 'shell' })
      expect(await port.sendPrompt(none, 'Go on.')).toEqual({ ok: true, value: 'notFound' })
      expect(await port.cancel(none)).toEqual({ ok: true, value: 'notFound' })
    })

    it('stops a chat that works with one Escape, and sends no Escape to a chat that does not work', async () => {
      const { port, expected, setStatus, received } = await setup()
      const { chat } = await chatsToUse(port, expected)
      const stops = async () => (await received()).filter((r) => r === 'stop').length
      const before = await stops()
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      expect(await port.cancel(chat)).toEqual({ ok: true, value: 'notWorking' })
      await setStatus('working')
      await statusShown(port, expected, 'working')
      expect(await port.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the Escape to arrive', async () => (await stops()) === before + 1)
      await setStatus('idle')
    })

    it("sends no prompt while the chat's input box holds text, and sends it once the box is empty", async () => {
      const { port, expected, setStatus, received, typeInput, clearInput } = await setup()
      const { chat } = await chatsToUse(port, expected)
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      await typeInput('half a thought')
      try {
        expect(await port.sendPrompt(chat, 'Check the build.')).toEqual({ ok: true, value: 'inputNotEmpty' })
      } finally {
        await clearInput()
      }
      expect(await port.sendPrompt(chat, 'Check the build.')).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the prompt to arrive', async () => (await received()).includes('text:Check the build.'))
      expect((await received()).filter((r) => r.startsWith('text:') && r.includes('half a thought'))).toEqual([])
    })

    it('clears the prompt that a chat puts back after its stop, so the next prompt goes alone', async () => {
      const { port, expected, setStatus, received } = await setup()
      const { chat } = await chatsToUse(port, expected)
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      expect(await port.sendPrompt(chat, 'Write a long essay.')).toEqual({ ok: true, value: 'sent' })
      await setStatus('working')
      await statusShown(port, expected, 'working')
      expect(await port.cancel(chat)).toEqual({ ok: true, value: 'sent' })
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      expect(await port.sendPrompt(chat, 'Reply OK.')).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the prompt to arrive', async () => (await received()).includes('text:Reply OK.'))
      expect((await received()).filter((r) => r.startsWith('text:')).at(-1)).toBe('text:Reply OK.')
    })

    it('empties an input box that holds text the owner typed, so the next prompt goes alone', async () => {
      const { port, expected, setStatus, received, typeInput } = await setup()
      const { chat } = await chatsToUse(port, expected)
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      expect(await port.clearInputBox(chat)).toEqual({ ok: true, value: 'cleared' })
      await typeInput('half a thought')
      expect(await port.sendPrompt(chat, 'Check the build.')).toEqual({ ok: true, value: 'inputNotEmpty' })
      expect(await port.clearInputBox(chat)).toEqual({ ok: true, value: 'cleared' })
      expect(await port.sendPrompt(chat, 'Check the tests.')).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the prompt to arrive', async () => (await received()).includes('text:Check the tests.'))
      expect((await received()).filter((r) => r.includes('half a thought'))).toEqual([])
    })

    it('takes back a prompt whose Enter the chat did not take, so the next prompt goes alone', async () => {
      const { port, expected, setStatus, received, dropNextEnter } = await setup()
      const { chat } = await chatsToUse(port, expected)
      await setStatus('idle')
      await statusShown(port, expected, 'idle')
      await dropNextEnter()
      expect(await port.sendPrompt(chat, 'Check the lint.')).toEqual({ ok: true, value: 'notSubmitted' })
      expect(await port.sendPrompt(chat, 'Check the types.')).toEqual({ ok: true, value: 'sent' })
      await untilAsync('the prompt to arrive', async () => (await received()).includes('text:Check the types.'))
      expect((await received()).filter((r) => r.includes('Check the lint.'))).toEqual([])
    })

    it('clears no input box of a shell or of a chat that the machine does not have', async () => {
      const { port, expected } = await setup()
      const { shell } = await chatsToUse(port, expected)
      expect(await port.clearInputBox(shell)).toEqual({ ok: true, value: 'shell' })
      const none = ChatId.parse(`${port.machine}/no-such-chat`)
      expect(await port.clearInputBox(none)).toEqual({ ok: true, value: 'notFound' })
    })

    it('sends no command to a shell or to a chat that the machine does not have', async () => {
      const { port, expected } = await setup()
      const { shell } = await chatsToUse(port, expected)
      expect(await port.sendCommand(shell, { command: 'clear' })).toEqual({ ok: true, value: 'shell' })
      const none = ChatId.parse(`${port.machine}/no-such-chat`)
      expect(await port.sendCommand(none, { command: 'compact' })).toEqual({ ok: true, value: 'notFound' })
    })

    it('asks no side question of a shell or of a chat that the machine does not have', async () => {
      const { port, expected } = await setup()
      const { shell } = await chatsToUse(port, expected)
      const signal = new AbortController().signal
      expect(await port.askSide(shell, 'Why?', signal)).toEqual({ ok: true, value: 'noSession' })
      const none = ChatId.parse(`${port.machine}/no-such-chat`)
      expect(await port.askSide(none, 'Why?', signal)).toEqual({ ok: true, value: 'notFound' })
    })

    it('sets no effort for a shell or a chat that the machine does not have', async () => {
      const { port, expected } = await setup()
      const { shell } = await chatsToUse(port, expected)
      expect(await port.setEffort(shell, 'high')).toEqual({ ok: true, value: 'shell' })
      expect(await port.restartModel(shell, 'opus')).toEqual({ ok: true, value: 'shell' })
      expect(await port.restartModel(ChatId.parse(`${port.machine}/no-such-chat`), 'opus')).toEqual({
        ok: true,
        value: 'notFound',
      })
      expect(await port.setEffort(ChatId.parse(`${port.machine}/no-such-chat`), 'low')).toEqual({
        ok: true,
        value: 'notFound',
      })
    })

    it('writes no layout of a chat that the machine does not have, and swaps no chat with itself', async () => {
      const { port, expected } = await setup()
      const { chat } = await chatsToUse(port, expected)
      const none = ChatId.parse(`${port.machine}/no-such-chat`)
      expect(await port.focusChat(none)).toEqual({ ok: true, value: 'notFound' })
      expect(await port.zoomChat(none, true)).toEqual({ ok: true, value: 'notFound' })
      expect(await port.swapChats(chat, none)).toEqual({ ok: true, value: 'notFound' })
      expect(await port.closeChat(none)).toEqual({ ok: true, value: 'notFound' })
      expect(await port.swapChats(chat, chat)).toEqual({ ok: true, value: 'samePane' })
      expect(await port.splitChat(none, 'row')).toEqual({ ok: true, value: 'notFound' })
      const otherMachine = TabId.parse('another-machine/w1:t1')
      expect(await port.setSplitRatio(otherMachine, [], 0.5)).toEqual({ ok: true, value: 'notFound' })
      expect(await port.moveChat(chat, otherMachine, 'row')).toEqual({ ok: true, value: 'notFound' })
      expect(await port.moveChat(none, otherMachine, 'row')).toEqual({ ok: true, value: 'notFound' })
    })

    it('renames no workspace or chat that the machine does not have, and takes no order that misses one', async () => {
      const { port } = await setup()
      const none = WorkspaceId.parse(`${port.machine}/no-such-workspace`)
      expect(await port.renameWorkspace(WorkspaceId.parse('another-machine/w1'), 'x')).toEqual({
        ok: true,
        value: 'notFound',
      })
      expect(await port.renameChat(ChatId.parse(`${port.machine}/no-such-chat`), 'x')).toEqual({
        ok: true,
        value: 'notFound',
      })
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const ids = read.value.map((w) => w.id)
      expect(await port.orderWorkspaces(ids.slice(1))).toEqual({ ok: true, value: 'stale' })
      expect(await port.closeWorkspace(none, 1)).toEqual({ ok: true, value: 'notFound' })
      const own = read.value.find((w) => w.chats.length > 0)
      if (own === undefined) throw new Error('no workspace has a chat')
      expect(await port.closeWorkspace(own.id, own.chats.length + 1)).toEqual({ ok: true, value: 'panesChanged' })
      expect(await port.orderWorkspaces([...ids, none])).toEqual({ ok: true, value: 'stale' })
    })

    it("moves a shell to a new tab of the chat's workspace with its chat ID, and no chat to its own workspace", async () => {
      const { port, expected } = await setup()
      const { chat } = await chatsToUse(port, expected)
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const home = read.value.find((w) => w.chats.some((c) => c.id === chat))
      if (home === undefined) throw new Error('no workspace lists the expected chat')
      // A shell of another workspace than the chat's (the e2e session has one for this case). A pane of an agent that
      // the port does not drive lists as a shell too, and no write reaches it: take the first shell that the port
      // finds, which a move to its own workspace shows.
      let found: { shell: ChatId; away: WorkspaceId } | undefined
      for (const away of read.value.filter((w) => w.id !== home.id))
        for (const candidate of away.chats.filter((c) => c.kind === 'shell')) {
          const own = await port.moveToWorkspace(candidate.id, away.id)
          if (found === undefined && own.ok && own.value === 'sameWorkspace')
            found = { shell: candidate.id, away: away.id }
        }
      if (found === undefined) throw new Error("no shell of another workspace than the chat's is in its workspace")
      const { shell } = found
      expect(await port.moveToWorkspace(shell, WorkspaceId.parse(`${port.machine}/no-such-workspace`))).toEqual({
        ok: true,
        value: 'notFound',
      })
      const moved = await port.moveToWorkspace(shell, home.id)
      if (!moved.ok || typeof moved.value !== 'object') throw new Error('the shell did not move')
      // The chat ID comes from the pane's terminal, which a move keeps.
      expect(moved.value.to).toBe(moved.value.from)
    })

    it('focuses the pane of a listed chat, and closes no chat whose agent works', async () => {
      const { port, expected, setStatus } = await setup()
      const { chat } = await chatsToUse(port, expected)
      expect(await port.focusChat(chat)).toEqual({ ok: true, value: 'done' })
      await setStatus('working')
      await statusShown(port, expected, 'working')
      expect(await port.closeChat(chat)).toEqual({ ok: true, value: 'working' })
    })

    it('says the agents are unreachable to a prompt and a stop when they do not answer', async () => {
      const { unreachable } = await setup()
      const chat = ChatId.parse(`${unreachable.machine}/any-chat`)
      for (const answer of [
        await unreachable.sendPrompt(chat, 'Go on.'),
        await unreachable.cancel(chat),
        await unreachable.clearInputBox(chat),
        await unreachable.sendCommand(chat, { command: 'clear' }),
      ])
        expect(answer).toMatchObject({ ok: false, error: { reason: 'unreachable' } })
    })

    it('lists workspaces that match the contract schema', async () => {
      const { port } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      for (const workspace of read.value) expect(WorkspaceSummary.parse(workspace)).toEqual(workspace)
    })

    it("gives IDs that hold the port's machine, each chat ID once", async () => {
      const { port } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const chats = read.value.flatMap((w) => w.chats.map((c) => c.id))
      for (const id of [...read.value.map((w) => w.id), ...chats]) expect(splitId(id).machine).toBe(port.machine)
      expect(new Set(chats).size).toBe(chats.length)
    })

    it('gives each listed chat its own pane ID on its machine', async () => {
      const { port } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const panes = read.value.flatMap((w) => w.chats.map((c) => c.pane))
      for (const pane of panes) expect(splitId(pane).machine).toBe(port.machine)
      expect(new Set(panes).size).toBe(panes.length)
    })

    it('lists the expected chat in its workspace', async () => {
      const { port, expected } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const workspace = read.value.find((w) => w.label === expected.workspace)
      expect(workspace?.chats.map((c) => c.title)).toContain(expected.chat)
    })

    it('lists a pane with no Claude or Codex chat as a shell chat, with its program as the model', async () => {
      const { port, expected } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const workspace = read.value.find((w) => w.label === expected.shell.workspace)
      const shells = workspace?.chats.filter((c) => c.kind === 'shell') ?? []
      expect(shells.map((c) => c.model)).toContain(expected.shell.program)
      for (const shell of shells) expect(shell.contextUsed).toBeNull()
    })

    it("reads a listed workspace's layout, with a pane for each of its listed chats and no other", async () => {
      const { port, expected } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const workspace = list.value.find((w) => w.label === expected.workspace)
      if (!workspace) throw new Error(`no workspace ${expected.workspace}`)
      const read = await port.readLayout(workspace.id)
      if (!read.ok) throw new Error(read.error.message)
      if (read.value === null) throw new Error(`no layout for ${workspace.id}`)
      expect(WorkspaceLayout.parse(read.value)).toEqual(read.value)
      expect(read.value.workspace).toBe(workspace.id)
      const panes = read.value.tabs.flatMap((t) => chatsOf(t.root))
      expect([...panes].sort()).toEqual(workspace.chats.map((c) => c.id).sort())
    })

    it("reads the expected chat's transcript in the contract's shape, and none for a shell", async () => {
      const { port, expected } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const chats = list.value.flatMap((w) => w.chats)
      const chat = chats.find((c) => c.title === expected.chat)
      if (!chat) throw new Error(`no chat ${expected.chat}`)
      const read = await port.readTranscript(chat.id)
      if (!read.ok) throw new Error(read.error.message)
      if (read.value === null) throw new Error(`no transcript for ${chat.id}`)
      for (const entry of read.value.entries) expect(TranscriptEntry.parse(entry)).toEqual(entry)
      expect(new Set(read.value.entries.map((e) => e.id)).size).toBe(read.value.entries.length)
      const shellWorkspace = list.value.find((w) => w.label === expected.shell.workspace)
      const shell = shellWorkspace?.chats.find((c) => c.kind === 'shell')
      if (!shell) throw new Error('no shell chat')
      expect(await port.readTranscript(shell.id)).toEqual({ ok: true, value: { entries: [], earlier: false } })
    })

    it("gives a Claude chat's turn end as an ISO time, and null for a shell", async () => {
      const { port, expected, transcript } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const chat = list.value.flatMap((w) => w.chats).find((c) => c.title === transcript.chat)
      if (!chat) throw new Error(`no chat ${transcript.chat}`)
      const end = await port.turnEnd(chat.id)
      if (!end.ok) throw new Error(end.error.message)
      if (end.value === null) throw new Error('no turn end for a Claude chat with a session file')
      expect(new Date(end.value).toISOString()).toBe(end.value)
      const shell = list.value.find((w) => w.label === expected.shell.workspace)?.chats.find((c) => c.kind === 'shell')
      if (!shell) throw new Error('no shell chat')
      expect(await port.turnEnd(shell.id)).toEqual({ ok: true, value: null })
    })

    it('gives a Claude chat\'s "/" list in the contract\'s shape, the built-in commands first, and none for a shell', async () => {
      const { port, expected, transcript } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      // The chat with a transcript is a Claude chat.
      const chat = list.value.flatMap((w) => w.chats).find((c) => c.title === transcript.chat)
      if (!chat) throw new Error(`no chat ${transcript.chat}`)
      const read = await port.readSkills(chat.id)
      if (!read.ok || read.value === null) throw new Error('no skills')
      for (const skill of read.value) expect(ChatSkill.parse(skill)).toEqual(skill)
      expect(read.value.slice(0, 4).map((s) => s.name)).toEqual(['compact', 'clear', 'model', 'effort'])
      expect(new Set(read.value.map((s) => s.name)).size).toBe(read.value.length)
      const shell = list.value.find((w) => w.label === expected.shell.workspace)?.chats.find((c) => c.kind === 'shell')
      if (!shell) throw new Error('no shell chat')
      expect(await port.readSkills(shell.id)).toEqual({ ok: true, value: [] })
    })

    it("tells a watcher when a chat's transcript changes, with the new entry in the next read, and nothing after close", async () => {
      const { port, transcript } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const chat = list.value.flatMap((w) => w.chats).find((c) => c.title === transcript.chat)
      if (!chat) throw new Error(`no chat ${transcript.chat}`)
      const before = await port.readTranscript(chat.id)
      if (!before.ok || before.value === null) throw new Error('no transcript to watch')
      let changes = 0
      const watch = port.watchTranscript(
        chat.id,
        () => (changes += 1),
        (error) => {
          throw new Error(error.message)
        },
      )
      await watch.ready
      await transcript.append()
      await until('the transcript change', () => changes > 0)
      const after = await port.readTranscript(chat.id)
      if (!after.ok || after.value === null) throw new Error('no transcript after the change')
      expect(after.value.entries.length).toBe(before.value.entries.length + 1)
      watch.close()
      const closedAt = changes
      await transcript.append()
      await new Promise((r) => setTimeout(r, 200))
      expect(changes).toBe(closedAt)
    })

    it("tells a transcript watcher when the chat's status changes, as a tool stops running with it", async () => {
      const { port, expected, setStatus } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const chat = list.value.flatMap((w) => w.chats).find((c) => c.title === expected.chat)
      if (!chat) throw new Error(`no chat ${expected.chat}`)
      let changes = 0
      const watch = port.watchTranscript(
        chat.id,
        () => (changes += 1),
        (error) => {
          throw new Error(error.message)
        },
      )
      await watch.ready
      await setStatus('working')
      await setStatus('idle')
      await until('the status change', () => changes > 0)
      watch.close()
    })

    it('gives no transcript for a chat that the machine does not have', async () => {
      const { port } = await setup()
      for (const id of [`${port.machine}/no-such-chat`, 'another-mac/no-such-chat'])
        expect(await port.readTranscript(ChatId.parse(id))).toEqual({ ok: true, value: null })
    })

    it('gives no layout for a workspace that the machine does not have', async () => {
      const { port } = await setup()
      const read = await port.readLayout(WorkspaceId.parse(`${port.machine}/no-such-workspace`))
      expect(read).toEqual({ ok: true, value: null })
    })

    it('says the agents are unreachable when they do not answer, to a read and to a subscriber', async () => {
      const { unreachable } = await setup()
      const read = await unreachable.listWorkspaces()
      expect(read.ok ? undefined : read.error.reason).toBe('unreachable')
      const layout = await unreachable.readLayout(WorkspaceId.parse(`${unreachable.machine}/w1`))
      expect(layout.ok ? undefined : layout.error.reason).toBe('unreachable')
      const transcript = await unreachable.readTranscript(ChatId.parse(`${unreachable.machine}/c1`))
      expect(transcript.ok ? undefined : transcript.error.reason).toBe('unreachable')
      const watchEnds: string[] = []
      unreachable.watchTranscript(
        ChatId.parse(`${unreachable.machine}/c1`),
        () => undefined,
        (error) => watchEnds.push(error.reason),
      )
      await until('the end of the watch', () => watchEnds.length > 0)
      expect(watchEnds).toEqual(['unreachable'])
      const ends: string[] = []
      const subscription = unreachable.subscribe(
        () => undefined,
        (error) => ends.push(error.reason),
      )
      await until('the end of the subscription', () => ends.length > 0)
      subscription.close()
      expect(ends).toEqual(['unreachable'])
    })

    it('gives the same IDs on a second read', async () => {
      const { port } = await setup()
      const ids = async () => {
        const read = await port.listWorkspaces()
        if (!read.ok) throw new Error(read.error.message)
        return read.value.map((w) => [w.id, w.chats.map((c) => c.id)])
      }
      expect(await ids()).toEqual(await ids())
    })

    it("tells a subscriber when a workspace's layout changes, with the workspace's listed ID", async () => {
      const { port, expected, changeLayout } = await setup()
      const list = await port.listWorkspaces()
      if (!list.ok) throw new Error(list.error.message)
      const workspace = list.value.find((w) => w.label === expected.workspace)
      if (!workspace) throw new Error(`no workspace ${expected.workspace}`)
      const events: AgentEvent[] = []
      const subscription = port.subscribe(
        (event) => events.push(event),
        () => undefined,
      )
      await subscription.ready
      await changeLayout()
      await until('the layout event', () =>
        events.some((e) => e.type === 'layoutChanged' && e.workspace === workspace.id),
      )
      subscription.close()
    })

    it('tells a subscriber to read the list again when a chat goes idle, for its new context share', async () => {
      const { port, expected, setStatus } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const chat = read.value.flatMap((w) => w.chats).find((c) => c.title === expected.chat)
      if (!chat) throw new Error(`no chat ${expected.chat}`)
      const events: AgentEvent[] = []
      const subscription = port.subscribe(
        (event) => events.push(event),
        (error) => {
          throw new Error(error.message)
        },
      )
      await subscription.ready
      await setStatus('working')
      await until('the working status event', () => events.some((e) => e.type === 'chatStatus'))
      // The stream itself tells one list change when it starts; a working chat adds none.
      const lists = () => events.filter((e) => e.type === 'workspacesChanged').length
      await new Promise((r) => setTimeout(r, 300))
      const before = lists()
      await setStatus('idle')
      await until('the list change after idle', () => lists() > before)
      subscription.close()
      await new Promise((r) => setTimeout(r, 300))
    })

    it("tells a subscriber a chat's new status with the chat's listed ID, and nothing after close", async () => {
      const { port, expected, setStatus } = await setup()
      const read = await port.listWorkspaces()
      if (!read.ok) throw new Error(read.error.message)
      const chat = read.value.flatMap((w) => w.chats).find((c) => c.title === expected.chat)
      if (!chat) throw new Error(`no chat ${expected.chat}`)
      const events: AgentEvent[] = []
      const ends: string[] = []
      const subscription = port.subscribe(
        (event) => events.push(event),
        (error) => ends.push(error.message),
      )
      await subscription.ready
      const statusOf = (status: ChatStatus) =>
        events.some((e) => e.type === 'chatStatus' && e.chat === chat.id && e.status === status)
      await setStatus('working')
      await until('the working status event', () => statusOf('working'))
      subscription.close()
      const seen = events.length
      await setStatus('idle')
      await new Promise((r) => setTimeout(r, 300))
      expect(events.length).toBe(seen)
      expect(ends).toEqual([])
    })
  })
}
