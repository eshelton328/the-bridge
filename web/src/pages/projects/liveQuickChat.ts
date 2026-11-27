// Quick chat on a live project's page (R8): `POST /api/chats` in the
// project's place (lib/startChat.ts; the server tags the pane, #549) with no
// name, tag or first message. On `ready` the text goes through the chat's
// send route and the page opens the chat; on `needsYou` or `starting` it keeps
// the text, and so on `duplicateCreate`, a retry whose start still runs (its
// answer names no chat). A retry sends the same create ID and send ID. The
// send, its lines and its 8 s timeout are Workspaces' (lib/chatSend.ts), and
// a text over maxPromptChars starts nothing.
import { maxPromptChars, ProjectSlug, SendId } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { readSendResult, sendPrompt } from '../../lib/chatSend.ts'
import { startChat } from '../../lib/startChat.ts'

/** One Quick chat: the project, the text, and the IDs a retry keeps. */
export type QuickChatAttempt = { project: string; text: string; createId: string; sendId: string }

type Result = { readonly chat: string } | { readonly line: string; readonly retry: boolean }

const kept = (line: string, retry = false): Result => ({ line, retry })
const starting = 'The chat is still starting; see Workspaces'

/** Sends the text with Workspaces' send (lib/chatSend.ts); a refused retry (duplicateSend) counts only when `sent`. */
async function send(chat: string, attempt: QuickChatAttempt): Promise<Result> {
  const answer = await sendPrompt(chat, attempt.text, [], attempt.sendId, report)
  if (answer === true) return { chat }
  if (answer !== false && !answer.retry && (await readSendResult(chat, attempt.sendId)) === 'sent') return { chat }
  return answer === false ? kept('Not sent', true) : kept(answer.line, answer.retry)
}

/** Starts the chat of `attempt` and sends its text when the chat is ready. */
export async function quickChat(attempt: QuickChatAttempt): Promise<Result> {
  const over = attempt.text.length - maxPromptChars
  if (over > 0) return kept(`Message too long — ${String(over)} ${over === 1 ? 'character' : 'characters'} over`)
  const place = { in: 'project' as const, project: ProjectSlug.parse(attempt.project) }
  const answer = await startChat({ kind: 'claude', place, createId: SendId.parse(attempt.createId) }, report)
  if (answer.kind === 'miss') return kept(answer.line, answer.retry)
  if (answer.kind === 'gone') return kept('This project is gone')
  if (answer.kind === 'duplicateCreate') return kept(starting)
  if (answer.kind !== 'started') return kept('Could not start the chat')
  const { chat, state } = answer.started
  if (state === 'ready' && chat !== undefined) return send(chat, attempt)
  return kept(state === 'needsYou' ? 'This chat needs you on the Mac' : starting)
}
