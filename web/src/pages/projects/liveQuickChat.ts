// Quick chat on a live project's page (R8): `POST /api/chats` in the
// project's place (lib/startChat.ts; the server tags the pane, #549) with no
// name, tag or first message. On `ready` the text goes through the chat's
// send route and the page opens the chat; on `needsYou` or `starting` it keeps
// the text, and so on `duplicateCreate`, a retry whose start still runs (its
// answer names no chat). A retry sends the same create ID and send ID.
// report() gets a fault by kind and status only, never the text.
import { ErrorBody, ProjectSlug, SendId, SendPromptRequest } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { readJson, startChat } from '../../lib/startChat.ts'

/** One Quick chat: the project, the text, and the IDs a retry keeps. */
export type QuickChatAttempt = { project: string; text: string; createId: string; sendId: string }

type Result = { readonly chat: string } | { readonly line: string; readonly retry: boolean }

const kept = (line: string, retry = false): Result => ({ line, retry })
const starting = 'The chat is still starting; see Workspaces'

/** Sends the text to the new chat; a 409 duplicateSend is a retry of a send that went through. */
async function send(chat: string, attempt: QuickChatAttempt): Promise<Result> {
  const json = SendPromptRequest.parse({ text: attempt.text, sendId: attempt.sendId })
  try {
    const res = await api.api.chats[':chat'].prompt.$post({ param: { chat: encodeURIComponent(chat) }, json })
    const error = res.ok ? undefined : ErrorBody.safeParse(readJson(await res.text())).data?.error
    if (res.ok || (error?.kind === 'chat-not-ready' && error.state === 'duplicateSend')) return { chat }
    if (res.status >= 500)
      report(new Error(`A quick chat send missed: ${error?.kind ?? 'status'} ${String(res.status)}`), 'live')
    return kept(`Not sent — the server answered ${String(res.status)}`, true)
  } catch {
    return kept('Not sent — the server did not answer', true)
  }
}

/** Starts the chat of `attempt` and sends its text when the chat is ready. */
export async function quickChat(attempt: QuickChatAttempt): Promise<Result> {
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
