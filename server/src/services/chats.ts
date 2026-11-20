// The chats service: what the server reads of one chat, its stop and its
// input clear. A prompt goes through sendPromptWithFiles in uploads.ts.
import type { ChatId, TranscriptResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, CancelOutcome, ClearOutcome } from './agentPort.ts'

/** The last entries of `chat`'s transcript; `null` when this machine has no such chat. */
export async function readTranscript(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<TranscriptResponse | null, AgentPortError>> {
  const read = await agents.readTranscript(chat)
  if (!read.ok || read.value === null) return read.ok ? ok(null) : read
  return ok({ chat, entries: read.value.entries, earlier: read.value.earlier })
}

/** Empties the input box of `chat`; the text it removes goes nowhere. */
export function clearInput(agents: AgentPort, chat: ChatId): Promise<Result<ClearOutcome, AgentPortError>> {
  return agents.clearInputBox(chat)
}

/** Stops the work of `chat`, when it works. */
export function stopChat(agents: AgentPort, chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>> {
  return agents.cancel(chat)
}
