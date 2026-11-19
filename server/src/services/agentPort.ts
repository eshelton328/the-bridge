// The AgentPort: the only way the server reaches agents (d-110), in the
// app's terms. Slice 1 reads; slice 2 adds subscribe, the live events;
// later slices add startChat, sendPrompt, cancel and answerApproval, each
// with the contract suite in adapters/agentPortContract.ts.
import type { ChatId, ChatStatus, MachineId, WorkspaceSummary } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** Why a port could not answer: the agents' host did not answer, or its reply had an unknown shape. */
export type AgentPortError = { readonly reason: 'unreachable' | 'badReply'; readonly message: string }

/** What a subscription tells: a chat's new status, or that the list of workspaces and chats changed. */
export type AgentEvent =
  | { readonly type: 'chatStatus'; readonly chat: ChatId; readonly status: ChatStatus }
  | { readonly type: 'workspacesChanged' }

export type AgentSubscription = {
  /** Resolves when the port listens, so a change after it is told; or when the subscription ended first. */
  readonly ready: Promise<void>
  /** Stops the subscription; the port then holds nothing open for it. */
  close(): void
}

export type AgentPort = {
  /** The machine whose agents this port reaches; every ID it gives holds it. */
  readonly machine: MachineId
  /** The workspaces and their chats, in the order the machine shows them. It reads only when called. */
  listWorkspaces(): Promise<Result<WorkspaceSummary[], AgentPortError>>
  /**
   * Starts one subscription: `onEvent` gets each change until `close()`. When the host stops answering,
   * `onEnd` gets why, once, and the subscription is over. It holds the host open only until then (d-112).
   */
  subscribe(onEvent: (event: AgentEvent) => void, onEnd: (error: AgentPortError) => void): AgentSubscription
}
