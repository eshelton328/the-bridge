// The package entry. Name each export; no `export *`.
export { LocalIdPart, ChatId, MachineId, PaneId, splitId, TabId, UploadId, WorkspaceId } from './ids.ts'
export { ClientErrorReport, ClientErrorSource } from './clientErrors.ts'
export { ErrorBody, ErrorKind, errorStatus } from './errors.ts'
export { EventEnvelope, EventSource, eventOf } from './events.ts'
export {
  chatsOf,
  CloseChatRequest,
  MoveChatRequest,
  FocusChatRequest,
  LayoutNode,
  maxSplitRatio,
  minSplitRatio,
  SetSplitRatioRequest,
  SplitChatRequest,
  SplitChatResponse,
  SplitDirection,
  SplitSide,
  SwapChatsRequest,
  TabLayout,
  WorkspaceLayout,
  ZoomChatRequest,
} from './layout.ts'
export {
  ChatCommandRequest,
  ClearInputRequest,
  maxAttachments,
  maxCompactChars,
  maxPromptChars,
  SendPromptRequest,
  StopChatRequest,
} from './prompts.ts'
export {
  CompleteUploadRequest,
  CompleteUploadResponse,
  maxUploadBytes,
  StartUploadRequest,
  StartUploadResponse,
} from './uploads.ts'
export { ChatStatusEvent, LayoutChangedEvent, LiveEvent, WorkspacesChangedEvent } from './liveEvents.ts'
export {
  AssistantEntry,
  ErrorEntry,
  maxErrorText,
  EntryId,
  maxEntryText,
  maxTranscriptEntries,
  ToolEntry,
  TranscriptChangedEvent,
  TranscriptEntry,
  TranscriptResponse,
  UserEntry,
  maxEntryFileName,
} from './transcripts.ts'
export {
  ChatEffort,
  ChatKind,
  ChatParent,
  ChatStatus,
  ChatSummary,
  ModelAlias,
  WorkspaceSummary,
  WorkspacesResponse,
} from './workspaces.ts'
