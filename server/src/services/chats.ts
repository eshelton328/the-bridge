// The chats service: what the server reads of one chat, its stop and its
// input clear and its commands. A prompt goes through sendPromptWithFiles in uploads.ts.
import {
  type ChatId,
  type AnswerDialogRequest,
  type ChatSkillsResponse,
  type KeyEffort,
  maxTranscriptEntries,
  type TranscriptQuery,
  type TranscriptResponse,
} from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type {
  AgentPort,
  AgentPortError,
  CancelOutcome,
  ChatCommand,
  ClearOutcome,
  CommandOutcome,
  DialogRead,
  EffortOutcome,
} from './agentPort.ts'

/** One page of `chat`'s transcript (see `TranscriptQuery`); `null` when this machine has no such chat. */
export async function readTranscriptPage(
  agents: AgentPort,
  chat: ChatId,
  { limit = maxTranscriptEntries, before }: TranscriptQuery,
): Promise<Result<TranscriptResponse | 'entryNotFound' | null, AgentPortError>> {
  const read = await agents.readTranscriptPage(chat, before === undefined ? { limit } : { limit, before })
  if (!read.ok) return read
  if (read.value === null || read.value === 'entryNotFound') return ok(read.value)
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

/** The dialog on `chat`'s screen while it waits for the owner (R69). */
export const readDialog = (agents: AgentPort, chat: ChatId): Promise<Result<DialogRead, AgentPortError>> =>
  agents.readDialog(chat)

/** Picks the owner's option of the dialog on `chat`'s screen, only while it shows that dialog (R69). */
export const answerDialog = (agents: AgentPort, chat: ChatId, answer: AnswerDialogRequest) =>
  agents.answerDialog(chat, answer)

/** Stops the work of `chat`, when it works. */
export function stopChat(agents: AgentPort, chat: ChatId): Promise<Result<CancelOutcome, AgentPortError>> {
  return agents.cancel(chat)
}
