// A live Claude chat's model (W10, backend #386, #390, #391): `POST
// /api/chats/:chat/model` with the contract's `RestartModelRequest`, `{ model,
// confirm }`, where `confirm` is the same chat ID. The server ends the idle
// chat and starts Claude again in the same pane with `--resume <session>
// --model <alias>`, never with `/model`, which would save the owner's default
// in settings.json. It answers 200 with the same chat ID and its state
// (`ready`, `starting` or `needsYou`), or 502 with `failed` and the session
// when the old chat ended and no new one resumed it: the owner resumes it on
// the Mac with `claude --resume <session>`, and the page tries nothing again.
//
// A miss gives the chip one short line by reason (`modelLines`). 409 sameModel
// does nothing. report() gets a 5xx and an answer the page does not expect,
// with the kind and the HTTP status only, never the chat ID, the session or the
// server's message. The chat ID is URL-encoded once, as the typed RPC client
// puts it in the path as it is.
import { ErrorBody, type ModelAlias, RestartModelRequest, RestartModelResponse } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { readJson } from './liveWorkspaces.ts'
import { modelLines } from './modelLines.ts'

/** How long the page waits: the server waits up to 5 s for the chat to end and 30 s for the new one to start. */
const restartWaitMs = 75_000

/** A model restart that missed, for report(): the kind and the status, and nothing else. */
class ModelMissError extends Error {
  readonly miss: string

  constructor(kind: string, status: number | undefined) {
    super(`A model restart missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'ModelMissError'
    this.miss = kind
  }
}

/** What became of a restart. */
export type ModelAnswer =
  | { readonly kind: 'restarted'; readonly state: 'ready' | 'starting' | 'needsYou' }
  | { readonly kind: 'failed'; readonly session: string }
  | { readonly kind: 'same' }
  | { readonly kind: 'miss'; readonly line: string }

const miss = (line: string): ModelAnswer => ({ kind: 'miss', line })

const unexpected = (kind: string, status: number | undefined): ModelAnswer => {
  report(new ModelMissError(kind, status), 'live')
  return miss(modelLines.failed)
}

async function answerOf(res: Response): Promise<ModelAnswer> {
  const body = readJson(await res.text())
  const restarted = RestartModelResponse.safeParse(body)
  if (res.status === 200 && restarted.success && restarted.data.state !== 'failed')
    return { kind: 'restarted', state: restarted.data.state }
  if (res.status === 502 && restarted.success && restarted.data.state === 'failed') {
    // The old chat ended: a fault for the owner to see and for report(), with no session in the report.
    report(new ModelMissError('failed', res.status), 'live')
    return { kind: 'failed', session: restarted.data.session }
  }
  const parsed = ErrorBody.safeParse(body)
  // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
  if (!parsed.success) return unexpected(res.status >= 500 ? 'unreachable' : 'bad-reply', res.status)
  const error = parsed.data.error
  switch (error.kind) {
    case 'chat-not-ready':
      if (error.state === 'sameModel') return { kind: 'same' }
      if (
        error.state === 'restarting' ||
        error.state === 'working' ||
        error.state === 'needsYou' ||
        error.state === 'skipsPermissions' ||
        error.state === 'launchArgsUnknown' ||
        error.state === 'folderChanged' ||
        error.state === 'inputNotEmpty'
      )
        return miss(modelLines[error.state])
      // inputUnreadable, noCommands and the like are states of the chat, not faults: no report.
      return miss(modelLines.failed)
    case 'not-found':
      return miss(modelLines.gone)
    case 'herdr-bad-reply':
      // The chat did not end, so nothing changed.
      report(new ModelMissError(error.kind, res.status), 'live')
      return miss(modelLines.notRestarted)
    case 'too-many-requests':
      return miss(modelLines.failed)
    case 'herdr-unavailable':
    case 'internal':
      return unexpected(error.kind, res.status)
    // The page sends only a model the contract takes and the chat's own ID, so a refusal is a bug.
    case 'invalid-input':
    case 'forbidden':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
      return unexpected(error.kind, res.status)
  }
}

/** Restarts the live chat `chat` (its server ID) with `model`, resuming the same session. */
export async function restartModel(chat: string, model: ModelAlias): Promise<ModelAnswer> {
  const body = RestartModelRequest.safeParse({ model, confirm: chat })
  if (!body.success) return miss(modelLines.failed)
  const signal = AbortSignal.timeout(restartWaitMs)
  try {
    const res = await api.api.chats[':chat'].model.$post(
      { param: { chat: encodeURIComponent(chat) }, json: body.data },
      { init: { signal } },
    )
    return await answerOf(res)
  } catch {
    // No answer in time, a server or tailnet out of reach, or a connection that dropped: the restart may have run.
    return miss(modelLines.noAnswer)
  }
}
