// The fake adapter of the AgentPort: fixed workspaces and chats, or a fixed
// error. API tests and web's mock-api source use it; the contract suite in
// agentPortContract.ts keeps it true to the herdr adapter.
import { ChatId, type MachineId, type WorkspaceSummary, WorkspaceId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import type { AgentPort, AgentPortError } from '../services/agentPort.ts'

/** The fake's default data: two workspaces of `machine`, one with a chat that needs the owner. */
export function fakeWorkspaces(machine: MachineId): WorkspaceSummary[] {
  const chat = (local: string) => ChatId.parse(`${machine}/${local}`)
  return [
    {
      id: WorkspaceId.parse(`${machine}/omni-brain`),
      label: 'omni-brain',
      chats: [
        {
          id: chat('bridge-themes'),
          kind: 'claude',
          title: 'bridge themes',
          model: 'claude-opus-5-5',
          contextUsed: 0.42,
          status: 'working',
          parent: null,
        },
        {
          id: chat('drift-check'),
          kind: 'codex',
          title: 'drift check',
          model: 'gpt-5.5',
          contextUsed: 0.23,
          status: 'needsYou',
          parent: null,
        },
      ],
    },
    { id: WorkspaceId.parse(`${machine}/omni`), label: 'omni', chats: [] },
  ]
}

export type FakeAgents = AgentPort & {
  /** How many times a caller read the workspaces. */
  readonly reads: () => number
}

/** A port that answers with `workspaces`, or always fails with `error`. */
export function createFakeAgents(
  machine: MachineId,
  answer: { readonly workspaces: WorkspaceSummary[] } | { readonly error: AgentPortError } = {
    workspaces: fakeWorkspaces(machine),
  },
): FakeAgents {
  let reads = 0
  return {
    machine,
    reads: () => reads,
    listWorkspaces() {
      reads += 1
      return Promise.resolve('error' in answer ? err(answer.error) : ok(structuredClone(answer.workspaces)))
    },
  }
}
