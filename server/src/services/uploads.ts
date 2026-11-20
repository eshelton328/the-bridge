// The uploads service (slice W1b): which chat may take a file, and the
// start of its upload. A Claude chat takes files; a shell or a Codex chat
// does not (Codex reads an image only when it starts).
import { type ChatId, maxUploadBytes, type StartUploadRequest, type UploadId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'
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

/** Starts an upload of `request` for `chat`, after it checks the size and that the chat is a Claude chat. */
export async function startUpload(
  agents: AgentPort,
  store: UploadStore,
  chat: ChatId,
  request: StartUploadRequest,
): Promise<Result<StartOutcome, StartError>> {
  if (request.size > maxUploadBytes) return ok('tooLarge')
  const listed = await agents.listWorkspaces()
  if (!listed.ok) return err({ from: 'agents', error: listed.error })
  const found = listed.value.flatMap((w) => w.chats).find((c) => c.id === chat)
  if (found === undefined) return ok('notFound')
  if (found.kind === 'shell') return ok('shell')
  if (found.kind !== 'claude') return ok('noAttachments')
  const upload = await store.start(chat, request.name, request.size)
  return upload.ok
    ? ok({ upload: upload.value, chunkSize: store.chunkSize })
    : err({ from: 'store', error: upload.error })
}
