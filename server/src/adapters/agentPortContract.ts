// The one contract test suite of the AgentPort (d-113). Every adapter runs
// it, the fake and herdr's, so the fake cannot drift from what it stands for.
import { type ChatStatus, splitId, WorkspaceSummary } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { AgentEvent, AgentPort } from '../services/agentPort.ts'

export type ContractSetup = {
  readonly port: AgentPort
  /** A workspace the adapter must list, and the title of a chat in it. */
  readonly expected: { readonly workspace: string; readonly chat: string }
  /** Gives the expected chat `status` (`working` or `idle`), as its agent would. */
  readonly setStatus: (status: 'working' | 'idle') => Promise<void>
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

    it('gives the same IDs on a second read', async () => {
      const { port } = await setup()
      const ids = async () => {
        const read = await port.listWorkspaces()
        if (!read.ok) throw new Error(read.error.message)
        return read.value.map((w) => [w.id, w.chats.map((c) => c.id)])
      }
      expect(await ids()).toEqual(await ids())
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
