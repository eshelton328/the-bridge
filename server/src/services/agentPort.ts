// The AgentPort: the only way the server reaches agents (d-110), in the
// app's terms. Slice 1 reads; later slices add startChat, sendPrompt,
// cancel, answerApproval and the events, each with the contract suite in
// adapters/agentPortContract.ts.
import type { MachineId, WorkspaceSummary } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** Why a port could not answer: the agents' host did not answer, or its reply had an unknown shape. */
export type AgentPortError = { readonly reason: 'unreachable' | 'badReply'; readonly message: string }

export type AgentPort = {
  /** The machine whose agents this port reaches; every ID it gives holds it. */
  readonly machine: MachineId
  /** The workspaces and their chats, in the order the machine shows them. It reads only when called. */
  listWorkspaces(): Promise<Result<WorkspaceSummary[], AgentPortError>>
}
