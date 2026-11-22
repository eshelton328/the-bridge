// A live Claude chat's effort (W10, backend #382): `POST
// /api/chats/:chat/effort` with the contract's `SetEffortRequest`, `{ effort }`
// with low, medium, high or xhigh. The server sets it for the chat's session
// only, with Claude Code's effort keys, never with `/effort`, which would save
// the owner's default; it answers 204 once the chat's screen shows the level.
// The list then gives the set level until the chat's next turn, and the
// event stream's `workspaces.changed` makes the page read it.
//
// A miss gives the chip one short line by reason: a chat that works (409
// working), that needs the owner (needsYou), whose message box holds text
// (inputNotEmpty), a chat whose model restart runs (restarting), a chat that is gone (404), and "Could not change the
// effort" for anything else. report() gets a 5xx and an answer the page does
// not expect, with the kind and the HTTP status only, never the chat ID or
// the server's message. The chat ID is URL-encoded once, as the typed RPC
// client puts it in the path as it is.
import { ErrorBody, type KeyEffort, SetEffortRequest } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import type { EffortAnswer } from './blocks/EffortPicker.tsx'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** An effort change that missed, for report(): the kind and the status, and nothing else. */
class EffortMissError extends Error {
  readonly miss: string

  constructor(kind: string, status: number | undefined) {
    super(`An effort change missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'EffortMissError'
    this.miss = kind
  }
}

/** The chip's lines, by reason. */
const effortLines = {
  working: 'Wait until the chat is idle',
  needsYou: 'The chat needs you on the Mac',
  inputNotEmpty: 'Clear the message box on the Mac first',
  restarting: 'The chat is restarting',
  gone: 'That chat is gone',
  failed: 'Could not change the effort',
} as const

const failed = (kind: string, status: number | undefined): EffortAnswer => {
  report(new EffortMissError(kind, status), 'live')
  return { line: effortLines.failed }
}

/** The chip's answer for a reply that is not 204. */
async function missOf(res: Response): Promise<EffortAnswer> {
  const parsed = ErrorBody.safeParse(readJson(await res.text()))
  // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
  if (!parsed.success) return failed(res.status >= 500 ? 'unreachable' : 'bad-reply', res.status)
  const error = parsed.data.error
  switch (error.kind) {
    case 'chat-not-ready':
      if (error.state === 'working') return { line: effortLines.working }
      if (error.state === 'needsYou') return { line: effortLines.needsYou }
      if (error.state === 'inputNotEmpty') return { line: effortLines.inputNotEmpty }
      // A model restart of the chat runs (W10): the server takes no other change meanwhile.
      if (error.state === 'restarting') return { line: effortLines.restarting }
      // inputUnreadable, noCommands and effortNotConfirmed are states of the chat, not faults: no report.
      return { line: effortLines.failed }
    case 'not-found':
      return { line: effortLines.gone }
    case 'too-many-requests':
      return { line: effortLines.failed }
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      return failed(error.kind, res.status)
    // The page sends only a level the contract takes, so a refusal is a bug; the upload kinds never come here.
    case 'invalid-input':
    case 'forbidden':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
      return failed(error.kind, res.status)
  }
}

/** Sets the effort of the live chat `chat` (its server ID) for its session: `true` once its screen shows `effort`. */
export async function setEffort(chat: string, effort: KeyEffort): Promise<EffortAnswer> {
  const body = SetEffortRequest.safeParse({ effort })
  if (!body.success) return { line: effortLines.failed }
  const signal = AbortSignal.timeout(liveReadTimeoutMs)
  try {
    const res = await api.api.chats[':chat'].effort.$post(
      { param: { chat: encodeURIComponent(chat) }, json: body.data },
      { init: { signal } },
    )
    if (res.status === 204) return true
    return await missOf(res)
  } catch {
    // No answer in time, a server or tailnet out of reach, or a connection that dropped while the error body came.
    return { line: effortLines.failed }
  }
}
