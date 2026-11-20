// The AgentPort: the only way the server reaches agents (d-110), in the
// app's terms. Slice 1 reads; slice 2 adds subscribe, the live events;
// slice 3a adds readLayout, the tabs and panes of a workspace;
// later slices add startChat, sendPrompt, cancel and answerApproval, each
// with the contract suite in adapters/agentPortContract.ts.
import type {
  ChatId,
  ChatStatus,
  MachineId,
  TranscriptEntry,
  WorkspaceId,
  WorkspaceLayout,
  WorkspaceSummary,
} from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** Why a port could not answer: the agents' host did not answer, or its reply had an unknown shape. */
export type AgentPortError = { readonly reason: 'unreachable' | 'badReply'; readonly message: string }

/**
 * What a subscription tells: a chat's new status, that a workspace's tabs or panes changed (read its layout
 * again), or that the list of workspaces and chats changed.
 */
export type AgentEvent =
  | { readonly type: 'chatStatus'; readonly chat: ChatId; readonly status: ChatStatus }
  | { readonly type: 'layoutChanged'; readonly workspace: WorkspaceId }
  | { readonly type: 'workspacesChanged' }

/** The last entries of a chat's transcript, and whether older entries exist. */
export type TranscriptRead = { readonly entries: TranscriptEntry[]; readonly earlier: boolean }

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
   * The tabs of one workspace and the split tree of each, with each pane named by the chat ID that
   * `listWorkspaces` gives it; `null` when this machine has no such workspace. It reads only when called.
   */
  readLayout(workspace: WorkspaceId): Promise<Result<WorkspaceLayout | null, AgentPortError>>
  /**
   * The last entries of one chat's transcript; no entries for a chat with no transcript (a shell, or a chat whose
   * session the adapter cannot read), and `null` when this machine has no such chat. It reads only that chat's
   * session, and only when called.
   */
  readTranscript(chat: ChatId): Promise<Result<TranscriptRead | null, AgentPortError>>
  /**
   * Watches one chat's transcript: `onChange` gets a call each time it may have changed (read it again with
   * `readTranscript`), until `close()`. It watches only that chat's session, with no timer (d-112). When the
   * agents stop answering, `onEnd` gets why, once, and the watch is over.
   */
  watchTranscript(chat: ChatId, onChange: () => void, onEnd: (error: AgentPortError) => void): AgentSubscription
  /**
   * Starts one subscription: `onEvent` gets each change until `close()`. An adapter whose subscription starts
   * after the call returns tells `workspacesChanged` when it starts, as the list may have changed in between. When the host stops answering,
   * `onEnd` gets why, once, and the subscription is over. It holds the host open only until then (d-112).
   */
  subscribe(onEvent: (event: AgentEvent) => void, onEnd: (error: AgentPortError) => void): AgentSubscription
}
