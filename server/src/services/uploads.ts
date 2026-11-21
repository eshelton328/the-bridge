// The uploads service (slice W1b): which chat may take a file, the start
// of its upload, and a prompt that carries files. The prompt gets a line
// that tells the chat to read each file, then one line for each path: a
// chat reads a bare path in a prompt as text, and with the line it opens
// each file with its own tools. A Claude chat takes files; a shell or a Codex chat
// does not (Codex reads an image only when it starts).
import {
  type ChatId,
  maxUploadBytes,
  type SendPromptRequest,
  type StartUploadRequest,
  type UploadId,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, PromptOutcome } from './agentPort.ts'
import type { UploadStore, UploadStoreError } from './uploadStore.ts'

/** The upload and its chunk size, or why the chat takes no file: no such chat, a shell, a Codex chat, too large. */
export type StartOutcome =
  | { readonly upload: UploadId; readonly chunkSize: number }
  | 'notFound'
  | 'shell'
  | 'noAttachments'
  | 'tooLarge'

/** Why the start failed: herdr, or the store. */
export type StartError =
  | { readonly from: 'agents'; readonly error: AgentPortError }
  | { readonly from: 'store'; readonly error: UploadStoreError }

/** What a chat with this ID can take: no such chat, a shell, a chat that takes no file, or a Claude chat. */
async function fileTaker(
  agents: AgentPort,
  chat: ChatId,
): Promise<Result<'notFound' | 'shell' | 'noAttachments' | 'claude', AgentPortError>> {
  const listed = await agents.listWorkspaces()
  if (!listed.ok) return listed
  const found = listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)
  if (found === undefined) return ok('notFound')
  if (found.kind === 'shell') return ok('shell')
  return ok(found.kind === 'claude' ? 'claude' : 'noAttachments')
}

/** The line before the paths; the transcript reads it to show the files apart from the prompt's text. */
export const attachedLine = 'Attached files (read each one with your tools):'

/** The prompt's text with the paths of its files below it. */
export function withAttachments(text: string, paths: readonly string[]): string {
  const block = [attachedLine, ...paths.map((path) => `- ${path}`)].join('\n')
  return text.trim() === '' ? block : `${text.trimEnd()}\n\n${block}`
}

/** The answer to a prompt: as a send, or why its files cannot go: a chat that takes none, a file that is not ready. */
export type FilePromptOutcome = PromptOutcome | 'noAttachments' | 'badAttachment'

/**
 * Sends the owner's prompt to `chat` with the path of each attached file. Each attachment must be a complete upload
 * of this chat (`badAttachment` otherwise), and only a Claude chat takes one.
 */
export async function sendPromptWithFiles(
  agents: AgentPort,
  store: UploadStore,
  chat: ChatId,
  { text, attachments = [] }: SendPromptRequest,
): Promise<Result<FilePromptOutcome, StartError>> {
  const fromAgents = (error: AgentPortError) => err({ from: 'agents' as const, error })
  if (attachments.length === 0) {
    const sent = await agents.sendPrompt(chat, text)
    return sent.ok ? sent : fromAgents(sent.error)
  }
  const taker = await fileTaker(agents, chat)
  if (!taker.ok) return fromAgents(taker.error)
  if (taker.value !== 'claude') return ok(taker.value)
  const paths: string[] = []
  for (const upload of new Set(attachments)) {
    const path = await store.attachment(upload, chat)
    if (!path.ok) return err({ from: 'store', error: path.error })
    if (path.value === null) return ok('badAttachment')
    paths.push(path.value)
  }
  const sent = await agents.sendPrompt(chat, withAttachments(text, paths))
  return sent.ok ? sent : fromAgents(sent.error)
}

/** Starts an upload of `request` for `chat`, after it checks the size and that the chat is a Claude chat. */
export async function startUpload(
  agents: AgentPort,
  store: UploadStore,
  chat: ChatId,
  request: StartUploadRequest,
): Promise<Result<StartOutcome, StartError>> {
  if (request.size > maxUploadBytes) return ok('tooLarge')
  const taker = await fileTaker(agents, chat)
  if (!taker.ok) return err({ from: 'agents', error: taker.error })
  if (taker.value !== 'claude') return ok(taker.value)
  const upload = await store.start(chat, request.name, request.size)
  return upload.ok
    ? ok({ upload: upload.value, chunkSize: store.chunkSize })
    : err({ from: 'store', error: upload.error })
}
