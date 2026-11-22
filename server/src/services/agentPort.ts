// The AgentPort: the only way the server reaches agents (d-110), in the
// app's terms. Slice 1 reads; slice 2 adds subscribe, the live events;
// slice 3a adds readLayout, the tabs and panes of a workspace; slice W1
// adds sendPrompt and cancel; later slices add startChat and
// answerApproval, each with the contract suite in
// adapters/agentPortContract.ts.
import type {
  KeyEffort,
  ChatSkill,
  ChatId,
  ChatStatus,
  MachineId,
  SplitDirection,
  SplitSide,
  TabId,
  TranscriptEntry,
  WorkspaceId,
  WorkspaceLayout,
  WorkspaceSummary,
  StartChatRequest,
  StartChatResponse,
  ModelAlias,
  RestartModelResponse,
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
 * `inputNotEmpty` when the chat's input box holds text, which the prompt would join, so nothing was sent;
 * `inputUnreadable` when the port cannot find the box on the chat's screen (a dialog, or a box it does not know), so
 * nothing was sent.
 */
type SendOutcome = 'sent' | 'notFound' | 'shell' | 'needsYou' | 'inputNotEmpty' | 'inputUnreadable'

/** As a send, or `notSubmitted` when the chat did not take the typed prompt, so the port removed the text again. */
export type PromptOutcome = SendOutcome | 'notSubmitted'

/**
 * What an input clear did: `cleared` when the box is empty now; as a send for a chat that cannot take it;
 * `noCommands` for a Codex chat, whose box the port cannot read; `inputNotEmpty` when text stayed.
 */
export type ClearOutcome = Exclude<SendOutcome, 'sent'> | 'cleared' | 'noCommands'

/**
 * What a command did: as a prompt; `working` when the chat works, as Claude Code would only queue the command;
 * `noCommands` for a Codex chat, which takes none from the port yet. Nothing was sent unless it is `sent`.
 */
export type CommandOutcome = PromptOutcome | 'working' | 'noCommands'

/**
 * What an effort change did (slice W10): `set` once the chat's screen shows the effort; `effortNotConfirmed`
 * when it does not after the keys; else why no key was sent, as a command.
 */
export type EffortOutcome = Exclude<CommandOutcome, 'sent' | 'notSubmitted'> | 'set' | 'effortNotConfirmed'

/**
 * What a model restart did (slice W10): the chat and its state once it started again with the same session; `failed`
 * with the session when the old chat ended and no new one resumed it; else why nothing was sent, as an effort
 * change, or `launchArgsUnknown`, `skipsPermissions`, `folderChanged` or `sameModel`.
 */
export type RestartOutcome =
  | Exclude<EffortOutcome, 'set' | 'effortNotConfirmed'>
  | 'launchArgsUnknown'
  | 'skipsPermissions'
  | 'folderChanged'
  | 'sameModel'
  | RestartModelResponse

/** A Claude Code command: `/compact` with the owner's instructions if any, or `/clear`. */
export type ChatCommand =
  | { readonly command: 'compact'; readonly instructions?: string | undefined }
  | { readonly command: 'clear' }

/**
 * What a pane write did (slice W2): `done`, or `notFound` when this machine has no such chat. A zoom of a tab's
 * only pane is `singlePane`; a swap of two chats in different tabs is `otherTab`, and of one chat with itself
 * `samePane`; a close of a chat whose agent works (or whose state herdr cannot tell) is `working`, and of one that
 * waits for the owner `needsYou`. Nothing changed unless it is `done`.
 */
export type PaneWriteOutcome = 'done' | 'notFound'
export type ZoomOutcome = PaneWriteOutcome | 'singlePane'
export type SwapOutcome = PaneWriteOutcome | 'otherTab' | 'samePane'
export type CloseOutcome = PaneWriteOutcome | 'working' | 'needsYou'
/** What a move did: as a write, or `sameTab` or `zoomedTab` when the tab cannot take the pane, so nothing moved. */
export type MoveOutcome = PaneWriteOutcome | 'sameTab' | 'zoomedTab'
/** An order of workspaces: `stale` when it does not name each listed workspace once. */
export type OrderOutcome = PaneWriteOutcome | 'stale'
/** What a split did: the chat of the new shell pane, or `notFound` when the chat has no pane. */
export type SplitOutcome = { readonly chat: ChatId } | 'notFound'
/**
 * What a start did (slice W3): the new pane, its chat once Claude has a session, and its state; `notFound` for no
 * such chat or workspace, `folderNotAllowed` for a folder outside the chat root, `nameTaken` for a name in use.
 */
type StartOutcome = StartChatResponse | 'notFound' | 'folderNotAllowed' | 'nameTaken'

/** What a stop did: as a send, or `notWorking` when the chat has no work to stop, so nothing was sent. */
export type CancelOutcome = Exclude<SendOutcome, 'needsYou' | 'inputNotEmpty' | 'inputUnreadable'> | 'notWorking'

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
   * The "/" list of one chat: for a Claude chat the built-in commands the page sends, then its skills and commands
   * by name; none for a Codex chat or a shell; `null` when this machine has no such chat. It reads only when called.
   */
  readSkills(chat: ChatId): Promise<Result<ChatSkill[] | null, AgentPortError>>
  /**
   * When one chat's last turn ended, as an ISO time: the last write of a Claude chat's session file. `null` for a
   * Codex chat, a shell, a chat with no session file yet and a chat this machine does not have. It reads only when
   * called, and only the file's change time.
   */
  turnEnd(chat: ChatId): Promise<Result<string | null, AgentPortError>>
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
   * join. After the send it reads the box again: when the prompt stays there, the chat did not take it, so the port
   * removes it and answers `notSubmitted`; when the box keeps text that it cannot remove, or cannot match to the
   * prompt (such as a long one), it answers `inputNotEmpty`. A prompt that a working chat queues leaves the box, so
   * it is `sent`.
   */
  sendPrompt(chat: ChatId, text: string): Promise<Result<PromptOutcome, AgentPortError>>
  /**
   * Empties the input box of one Claude chat, for text that another client typed there and did not send. The text is
   * lost, and the port never returns or logs it.
   */
  clearInputBox(chat: ChatId): Promise<Result<ClearOutcome, AgentPortError>>
  /**
   * Types one Claude Code command into a Claude chat that is idle, with the same input-box checks and answers as a
   * prompt. `/clear` starts a new session, so the chat then has a new chat ID on the same pane. It keeps no copy of
   * the instructions.
   */
  sendCommand(chat: ChatId, command: ChatCommand): Promise<Result<CommandOutcome, AgentPortError>>
  /**
   * Stops the work of one chat that is working, as one press of Escape in it; a chat that does not work gets nothing.
   * When the chat then puts the stopped prompt back in its input box, and that prompt is the last one this port sent
   * it, the port clears it; other text in the box stays.
   */
  cancel(chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>>
  /**
   * Sets the effort of an idle Claude chat with an empty input box for its session only, with Claude Code's effort
   * keys; never with `/effort`, which saves the owner's default.
   */
  setEffort(chat: ChatId, effort: KeyEffort): Promise<Result<EffortOutcome, AgentPortError>>
  /**
   * Restarts an idle Claude chat with an empty input box in its own pane, with the same session and `model`: it reads
   * the chat's command line and keeps only the flags it knows, ends the chat with ctrl+c and starts Claude again
   * with `--resume`. It never passes a flag that skips a permission and answers no prompt of the new chat.
   */
  restartModel(chat: ChatId, model: ModelAlias): Promise<Result<RestartOutcome, AgentPortError>>
  /** Makes the pane of one chat, a shell too, the focused pane of its tab. */
  focusChat(chat: ChatId): Promise<Result<PaneWriteOutcome, AgentPortError>>
  /** Shows only the pane of one chat in its tab, at full size (`zoomed` true), or ends the zoom of its tab. */
  zoomChat(chat: ChatId, zoomed: boolean): Promise<Result<ZoomOutcome, AgentPortError>>
  /** Swaps the places of two panes of one tab; each keeps its chat, and each chat keeps its ID. */
  swapChats(chat: ChatId, other: ChatId): Promise<Result<SwapOutcome, AgentPortError>>
  /**
   * Closes the pane of one chat, and so ends its agent or shell. It closes no chat whose agent works or waits for
   * the owner; the page asks the owner first, with the chat's name.
   */
  closeChat(chat: ChatId): Promise<Result<CloseOutcome, AgentPortError>>
  /**
   * Moves the pane of `chat` to `tab`, another tab of its workspace: the pane of `beside` (else the tab's
   * focused pane) splits in `direction`, and the moved pane takes its second part. The pane's agent or shell runs
   * on, and a tab whose last pane moves out closes.
   * `notFound` for no such chat, tab or `beside` chat in that tab, or a tab of another workspace.
   */
  moveChat(
    chat: ChatId,
    tab: TabId,
    direction: SplitDirection,
    beside?: ChatId,
  ): Promise<Result<MoveOutcome, AgentPortError>>
  /** Gives a workspace a new label, as herdr shows it. */
  renameWorkspace(workspace: WorkspaceId, label: string): Promise<Result<PaneWriteOutcome, AgentPortError>>
  /**
   * Gives the pane of one chat, a shell too, a new label. The list shows a pane's label as its chat's title before
   * the agent's own title, and the agent's herdr name does not change.
   */
  renameChat(chat: ChatId, label: string): Promise<Result<PaneWriteOutcome, AgentPortError>>
  /** Puts the workspaces in `order`, as herdr shows and lists them; `order` names each listed workspace once. */
  orderWorkspaces(order: readonly WorkspaceId[]): Promise<Result<OrderOutcome, AgentPortError>>
  /** Splits the pane of one chat in two, `row` with the new pane on the right, `column` below; the new pane is a shell. */
  splitChat(chat: ChatId, direction: SplitDirection): Promise<Result<SplitOutcome, AgentPortError>>
  /**
   * Starts a Claude chat in a new pane beside a chat (in its folder) or in a new tab of a workspace (in the folder of
   * its first pane), with no focus change and no flag that skips a permission. It answers no prompt of the new chat.
   */
  startChat(request: Omit<StartChatRequest, 'createId'>): Promise<Result<StartOutcome, AgentPortError>>
  /**
   * Gives the split of `tab` at `path` (from the tree's root; empty for the root) the share `ratio` for its first
   * part; `notFound` for no such tab or split.
   */
  setSplitRatio(
    tab: TabId,
    path: readonly SplitSide[],
    ratio: number,
  ): Promise<Result<PaneWriteOutcome, AgentPortError>>
}
