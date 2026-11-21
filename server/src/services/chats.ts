// The chats service: what the server reads of one chat, and what it sends
// to one chat for the owner.
import type { ChatId, TranscriptResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, CancelOutcome, ClearOutcome, PromptOutcome } from './agentPort.ts'

/** The last entries of `chat`'s transcript; `null` when this machine has no such chat. */
export async function readTranscript(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<TranscriptResponse | null, AgentPortError>> {
  const read = await agents.readTranscript(chat)
  if (!read.ok || read.value === null) return read.ok ? ok(null) : read
  return ok({ chat, entries: read.value.entries, earlier: read.value.earlier })
}

/** Sends the owner's prompt to `chat` only. The text goes to the port and nowhere else. */
export function sendPrompt(
  agents: AgentPort,
  chat: ChatId,
  text: string,
): Promise<Result<PromptOutcome, AgentPortError>> {
  return agents.sendPrompt(chat, text)
}

/** Empties the input box of `chat`; the text it removes goes nowhere. */
export function clearInput(agents: AgentPort, chat: ChatId): Promise<Result<ClearOutcome, AgentPortError>> {
  return agents.clearInputBox(chat)
}

/** Stops the work of `chat`, when it works. */
export function stopChat(agents: AgentPort, chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>> {
  return agents.cancel(chat)
}
