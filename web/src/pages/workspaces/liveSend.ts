// A live Claude chat's Send and Stop (W1): `POST /api/chats/:chat/prompt`
// with `{ text }` and `POST /api/chats/:chat/stop` with `{}`, each answering
// 204 with no body. The prompt reaches the transcript through the
// transcript stream (liveTranscript.ts), and the chat's status through the
// workspace events (liveWorkspaces.ts), so a 204 is all the page reads.
//
// A miss gives the composer one quiet line, by kind, as the transcript's
// line says "Transcript not live — <kind>": "Not sent — <kind>" or
// "Not stopped — <kind>", with Retry when the same request may work later (a
// 5xx, no answer, a timeout, a 429). A chat that waits for an answer in its
// terminal (409 `chat-not-ready` needsYou) and a chat that is gone (404)
// say so. A send to a chat whose terminal input holds text, or one the
// server cannot read (409 inputNotEmpty, W1-3: after a Stop, Claude Code
// puts the stopped prompt back there), asks the owner to clear it, with no
// Retry and no report, and offers "Clear the terminal input": `POST
// /api/chats/:chat/input/clear` with `{}` to the same chat, which answers 204
// once the input is empty (R28 part B); its misses say "Not cleared — …". A
// send that Claude Code did not take (409 notSubmitted: the server typed it
// and removed it again) says so, with Retry and no report. A Stop that finds the chat not working (409
// notWorking) is quiet: the chat stopped already. report() gets a ChatSendMissError for a 5xx and
// for an answer the page does not expect, with the action, the miss's kind
// and the HTTP status only: never the message text, the chat ID or the
// server's message. The requests go through the typed RPC client (backend
// #297), which puts the chat ID in the path as it is, so it is URL-encoded
// here, once.
//
// W1b: a send names the chat's complete uploads, in the order of its chips,
// and may have no text when it has a file. A 409 upload-conflict (a file the
// server no longer has as complete for this chat) sends nothing, says so
// and is not reported; the page fails those chips, and their Retry starts
// each file again (backend #309).
import { ClearInputRequest, ErrorBody, SendPromptRequest, StopChatRequest, type UploadId } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import type { ComposerAnswer } from './blocks/useComposerActions.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

type Action = 'send' | 'stop' | 'clear'

/** A send, a stop or a clear that missed, for report(): the action, the kind and the status, and nothing else. */
class ChatSendMissError extends Error {
  readonly miss: string

  constructor(action: Action, kind: string, status: number | undefined) {
    super(`A chat ${action} missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'ChatSendMissError'
    this.miss = kind
  }
}

/** The send line's words for a chat whose terminal input holds text. */
const inputNotEmptyText = "clear the text in the chat's terminal input, then send"

const lead: Record<Action, string> = { send: 'Not sent', stop: 'Not stopped', clear: 'Not cleared' }

/** The composer's line for a miss of `kind`, with Retry when `retry`. */
const line = (action: Action, text: string, retry: boolean): Exclude<ComposerAnswer, boolean> => ({
  line: `${lead[action]} — ${text}`,
  retry,
})

/** The answer of a miss the page does not expect: reported, with its kind and status, and a line with no Retry. */
function unexpected(action: Action, kind: string, status: number | undefined): ComposerAnswer {
  report(new ChatSendMissError(action, kind, status), 'live')
  return line(action, kind, false)
}

/** What the composer shows for an answer that is not 204; a send's inputNotEmpty line offers `clear`. */
async function missOf(
  action: Action,
  res: Response,
  clear: (() => Promise<ComposerAnswer>) | undefined,
): Promise<ComposerAnswer> {
  const parsed = ErrorBody.safeParse(readJson(await res.text()))
  if (!parsed.success) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    if (res.status >= 500) {
      report(new ChatSendMissError(action, 'unreachable', res.status), 'live')
      return line(action, 'unreachable', true)
    }
    return unexpected(action, res.ok ? 'bad-reply' : 'status', res.status)
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'chat-not-ready':
      if (error.state === 'needsYou') return line(action, 'chat waits for an answer in the terminal', false)
      if (action === 'send' && error.state === 'inputNotEmpty')
        return { ...line(action, inputNotEmptyText, false), clearInput: clear }
      if (action === 'clear' && error.state === 'inputNotEmpty') return line(action, 'the text is still there', false)
      if (action === 'send' && error.state === 'notSubmitted')
        return line(action, 'the chat did not take the message', true)
      // A Stop of a chat that is not working: it stopped already.
      if (action === 'stop' && error.state === 'notWorking') return false
      if (error.state === 'noAttachments') return line(action, 'this chat takes no files', false)
      return line(action, 'chat not ready', false)
    case 'not-found':
      return line(action, 'chat gone', false)
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      report(new ChatSendMissError(action, error.kind, res.status), 'live')
      return line(action, error.kind, true)
    case 'too-many-requests':
      return line(action, error.kind, true)
    case 'forbidden':
      return line(action, error.kind, false)
    case 'invalid-input':
      // The composer sends, and the line clears, only a body the contract takes, so the server's refusal is a bug.
      return unexpected(action, error.kind, res.status)
    case 'upload-conflict':
      // A send names a file that is not a complete upload of this chat: the page fails its chips.
      if (action === 'send')
        return { line: `${lead.send} — retry the files that failed`, retry: false, uploadConflict: true }
      return unexpected(action, error.kind, res.status)
    case 'too-large':
    case 'unsupported-media':
    case 'storage-full':
      // Only an upload gets these kinds, never a send, a stop or a clear.
      return unexpected(action, error.kind, res.status)
  }
}

/** Posts with `call` and gives the composer's answer: `true` on 204. */
async function post(
  action: Action,
  call: (signal: AbortSignal) => Promise<Response>,
  clear?: () => Promise<ComposerAnswer>,
): Promise<ComposerAnswer> {
  const signal = AbortSignal.timeout(liveReadTimeoutMs)
  let res: Response
  try {
    res = await call(signal)
  } catch {
    // fetch rejects when no answer comes in time, or when the server or the tailnet cannot be reached.
    return line(action, signal.aborted ? 'timeout' : 'unreachable', true)
  }
  if (res.status === 204) return true
  try {
    return await missOf(action, res, clear)
  } catch {
    // The connection dropped while the error body came.
    return line(action, signal.aborted ? 'timeout' : 'unreachable', true)
  }
}

/**
 * Sends `text` with the complete uploads `attachments` to the live chat `chat` (its server ID). A body the contract
 * refuses is not sent: the composer stops it first, so this answers `false` with no line.
 */
export function sendPrompt(chat: string, text: string, attachments: readonly UploadId[] = []): Promise<ComposerAnswer> {
  const body = SendPromptRequest.safeParse(attachments.length === 0 ? { text } : { text, attachments })
  if (!body.success) return Promise.resolve(false)
  return post(
    'send',
    (signal) =>
      api.api.chats[':chat'].prompt.$post(
        { param: { chat: encodeURIComponent(chat) }, json: body.data },
        { init: { signal } },
      ),
    // The line that asks the owner to clear the terminal input clears the chat this send went to, and no other.
    () => clearInput(chat),
  )
}

/** Empties the terminal input of the live chat `chat` (its server ID): `true` once the server says it is empty. */
export function clearInput(chat: string): Promise<ComposerAnswer> {
  const json = ClearInputRequest.parse({})
  return post('clear', (signal) =>
    api.api.chats[':chat'].input.clear.$post({ param: { chat: encodeURIComponent(chat) }, json }, { init: { signal } }),
  )
}

/** Stops the live chat `chat` (its server ID). */
export function stopChat(chat: string): Promise<ComposerAnswer> {
  const json = StopChatRequest.parse({})
  return post('stop', (signal) =>
    api.api.chats[':chat'].stop.$post({ param: { chat: encodeURIComponent(chat) }, json }, { init: { signal } }),
  )
}
