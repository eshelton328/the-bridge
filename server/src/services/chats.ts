// The chats service: what the server reads of one chat.
import type { ChatId, TranscriptResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

/** The last entries of `chat`'s transcript; `null` when this machine has no such chat. */
export async function readTranscript(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<TranscriptResponse | null, AgentPortError>> {
  const read = await agents.readTranscript(chat)
  if (!read.ok || read.value === null) return read.ok ? ok(null) : read
  return ok({ chat, entries: read.value.entries, earlier: read.value.earlier })
}
