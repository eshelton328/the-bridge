// The chats service: what the server reads of one chat, its stop and its
// input clear and its commands. A prompt goes through sendPromptWithFiles in uploads.ts.
import type { ChatId, ChatSkillsResponse, KeyEffort, TranscriptResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type {
  AgentPort,
  AgentPortError,
  CancelOutcome,
  ChatCommand,
  ClearOutcome,
  CommandOutcome,
  EffortOutcome,
} from './agentPort.ts'

/** The last entries of `chat`'s transcript; `null` when this machine has no such chat. */
export async function readTranscript(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<TranscriptResponse | null, AgentPortError>> {
  const read = await agents.readTranscript(chat)
  if (!read.ok || read.value === null) return read.ok ? ok(null) : read
  return ok({ chat, entries: read.value.entries, earlier: read.value.earlier })
}

/** The "/" list of `chat`; `null` when this machine has no such chat. */
export async function readSkills(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<ChatSkillsResponse | null, AgentPortError>> {
  const read = await agents.readSkills(chat)
  if (!read.ok || read.value === null) return read.ok ? ok(null) : read
  return ok({ chat, skills: read.value })
}

/** Empties the input box of `chat`; the text it removes goes nowhere. */
export function clearInput(agents: AgentPort, chat: ChatId): Promise<Result<ClearOutcome, AgentPortError>> {
  return agents.clearInputBox(chat)
}

/** Sends one Claude Code command to `chat`; the instructions of a `/compact` go to the chat only. */
export function sendCommand(
  agents: AgentPort,
  chat: ChatId,
  command: ChatCommand,
): Promise<Result<CommandOutcome, AgentPortError>> {
  return agents.sendCommand(chat, command)
}

/** Sets the effort of `chat` for its session only, with Claude Code's effort keys (slice W10). */
export function setEffort(
  agents: AgentPort,
  chat: ChatId,
  effort: KeyEffort,
): Promise<Result<EffortOutcome, AgentPortError>> {
  return agents.setEffort(chat, effort)
}

/** Stops the work of `chat`, when it works. */
export function stopChat(agents: AgentPort, chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>> {
  return agents.cancel(chat)
}
