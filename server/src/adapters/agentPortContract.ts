// The one contract test suite of the AgentPort (d-113). Every adapter runs
// it, the fake and herdr's, so the fake cannot drift from what it stands for.
import { type ChatStatus, chatsOf, splitId, WorkspaceId, WorkspaceLayout, WorkspaceSummary } from '@bridge/contract'
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
  /** A port of the same adapter whose agents do not answer, such as one on a socket that is not there. */
  readonly unreachable: AgentPort
}

/** Waits up to `ms` for `check` to pass. */
async function until(what: string, check: () => boolean, ms = 5000): Promise<void> {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 20))) if (check()) return
  throw new Error(`${what} did not happen in ${String(ms)} ms`)
}

export function describeAgentPort(name: string, setup: () => Promise<ContractSetup>): void {
  describe(`AgentPort contract: ${name}`, () => {
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
