// The layout writes of slice W2: focus, zoom, swap and close of a chat's
// pane, through the agent port. A close ends the pane's agent or shell and
// cannot be undone, so it goes to the port only when the request's confirm
// names this chat.
import type { ChatId } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type {
  AgentPort,
  AgentPortError,
  CloseOutcome,
  PaneWriteOutcome,
  SwapOutcome,
  ZoomOutcome,
} from './agentPort.ts'

/** Focuses the pane of `chat` in its tab. */
export function focusChat(agents: AgentPort, chat: ChatId): Promise<Result<PaneWriteOutcome, AgentPortError>> {
  return agents.focusChat(chat)
}

/** Shows only the pane of `chat` in its tab (`zoomed` true), or ends the zoom of its tab. */
export function zoomChat(
  agents: AgentPort,
  chat: ChatId,
  zoomed: boolean,
): Promise<Result<ZoomOutcome, AgentPortError>> {
  return agents.zoomChat(chat, zoomed)
}

/** Swaps the places of the panes of `chat` and `other`, two chats of one tab. */
export function swapChats(
  agents: AgentPort,
  chat: ChatId,
  other: ChatId,
): Promise<Result<SwapOutcome, AgentPortError>> {
  return agents.swapChats(chat, other)
}

/**
 * Closes the pane of `chat` when `confirm` names it: `notConfirmed` otherwise, with no call to the port. The port
 * closes no chat that works or waits for the owner.
 */
export async function closeChat(
  agents: AgentPort,
  chat: ChatId,
  confirm: ChatId,
): Promise<Result<CloseOutcome | 'notConfirmed', AgentPortError>> {
  if (confirm !== chat) return ok('notConfirmed')
  return agents.closeChat(chat)
}
