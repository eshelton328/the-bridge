// The one contract test suite of the AgentPort (d-113). Every adapter runs
// it, the fake and herdr's, so the fake cannot drift from what it stands for.
import { splitId, WorkspaceSummary } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { AgentPort } from '../services/agentPort.ts'

export type ContractSetup = {
  readonly port: AgentPort
  /** A workspace the adapter must list, and the title of a chat in it. */
  readonly expected: { readonly workspace: string; readonly chat: string }
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
  })
}
