// The AgentPort: the only way the server reaches agents (d-110), in the
// app's terms. Slice 1 reads; slice 2 adds subscribe, the live events;
// slice 3a adds readLayout, the tabs and panes of a workspace; slice W1
// adds sendPrompt and cancel; later slices add startChat and
// answerApproval, each with the contract suite in
// adapters/agentPortContract.ts.
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

/**
 * What a send or a stop did: `sent`; `notFound` when this machine has no such chat; `shell` when the chat is a
 * shell, which takes no prompt; `needsYou` when the chat waits for the owner's answer to a question;
 * `inputNotEmpty` when the chat's input box holds text, which the prompt would join, so nothing was sent.
 */
export type SendOutcome = 'sent' | 'notFound' | 'shell' | 'needsYou' | 'inputNotEmpty'

/** What a stop did: as a send, or `notWorking` when the chat has no work to stop, so nothing was sent. */
export type CancelOutcome = Exclude<SendOutcome, 'needsYou' | 'inputNotEmpty'> | 'notWorking'

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
  /**
   * Sends `text` to one Claude or Codex chat as the owner's next prompt, as if typed and sent. It sends to that chat
   * only, and keeps no copy of the text. It sends nothing to a chat whose input box holds text, so two prompts never
   * join.
   */
  sendPrompt(chat: ChatId, text: string): Promise<Result<SendOutcome, AgentPortError>>
  /**
   * Stops the work of one chat that is working, as one press of Escape in it; a chat that does not work gets nothing.
   * When the chat then puts the stopped prompt back in its input box, and that prompt is the last one this port sent
   * it, the port clears it; other text in the box stays.
   */
  cancel(chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>>
}
