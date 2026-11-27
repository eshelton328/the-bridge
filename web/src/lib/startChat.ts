// New chat on the live pages (W3, backend #378 to #381): `POST /api/chats`
// starts a Claude chat in a new tab of a workspace, in a new pane beside a
// chat, or in a project's folder (Quick chat, NCC-129), with no focus change in herdr, and waits up to 30 s for it. It
// answers 201 (or 200 for a create ID it has seen, with the first answer)
// with the new pane, its chat ID once Claude has a session, and its state:
// `ready`, `needsYou` (it waits for the owner on the Mac, such as Claude's
// folder trust question) or `starting` (not ready in 30 s; the workspace list
// shows it by its pane when it is).
//
// What a miss means to the form: 409 `nameTaken` is the name field's error,
// `folderNotAllowed` a line with no Retry, `duplicateCreate` a start with
// this create ID that still runs or failed in herdr (the page reads the list
// and finds the chat there), a 404 a chat or workspace that is gone, and a
// 5xx, a 429 or no answer "Could not start the chat" with Retry, which sends
// the same create ID. The page's `fault` (its report()) gets a NewChatMissError for a 5xx and for an
// answer the page does not expect, with the kind and the HTTP status only:
// never a name, a first message or the server's message.
import { ErrorBody, StartChatRequest, StartChatResponse } from '@bridge/contract'
import { api } from './api.ts'

export const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Where a start's fault goes: the page's report(), with its source. */
type Fault = (error: Error, source: 'live') => void

/** How long the page waits for the start's answer: the server waits 30 s for the chat, and herdr may take longer. */
const startWaitMs = 75_000

/** A start that missed, for report(): the kind and the status, and nothing else. */
class NewChatMissError extends Error {
  readonly miss: string

  constructor(kind: string, status: number | undefined) {
    super(`A chat start missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'NewChatMissError'
    this.miss = kind
  }
}

/** What became of a start. */
export type StartAnswer =
  | { readonly kind: 'started'; readonly started: StartChatResponse }
  | { readonly kind: 'nameTaken' }
  | { readonly kind: 'duplicateCreate' }
  | { readonly kind: 'gone' }
  | { readonly kind: 'miss'; readonly line: string; readonly retry: boolean }

const couldNot = 'Could not start the chat'

/** The answer of a miss the page does not expect: reported, with its kind and status, and a line with no Retry. */
function unexpected(fault: Fault, kind: string, status: number | undefined): StartAnswer {
  fault(new NewChatMissError(kind, status), 'live')
  return { kind: 'miss', line: couldNot, retry: false }
}

async function answerOf(res: Response, fault: Fault): Promise<StartAnswer> {
  const body = readJson(await res.text())
  if (res.status === 200 || res.status === 201) {
    const started = StartChatResponse.safeParse(body)
    return started.success ? { kind: 'started', started: started.data } : unexpected(fault, 'bad-reply', res.status)
  }
  const parsed = ErrorBody.safeParse(body)
  if (!parsed.success) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    if (res.status >= 500) {
      fault(new NewChatMissError('unreachable', res.status), 'live')
      return { kind: 'miss', line: couldNot, retry: true }
    }
    return unexpected(fault, 'status', res.status)
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'chat-not-ready':
      if (error.state === 'nameTaken') return { kind: 'nameTaken' }
      if (error.state === 'duplicateCreate') return { kind: 'duplicateCreate' }
      if (error.state === 'folderNotAllowed')
        return { kind: 'miss', line: 'This folder is not allowed for new chats', retry: false }
      return unexpected(fault, `${error.kind} ${error.state}`, res.status)
    case 'not-found':
      return { kind: 'gone' }
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      fault(new NewChatMissError(error.kind, res.status), 'live')
      return { kind: 'miss', line: couldNot, retry: true }
    case 'too-many-requests':
      return { kind: 'miss', line: couldNot, retry: true }
    case 'forbidden':
      return { kind: 'miss', line: couldNot, retry: false }
    case 'invalid-input':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
    case 'qa-not-ready':
    case 'linear-bad-reply':
    case 'linear-unavailable':
    case 'workspace-not-ready':
      // The page sends only a body the contract takes, and a start takes no file: the server's refusal is a bug.
      return unexpected(fault, error.kind, res.status)
  }
}

/**
 * Starts the chat `request` asks for. A request the contract refuses is not sent: the page checks the name first, so
 * this answers a line with no Retry and reports nothing.
 */
export async function startChat(request: StartChatRequest, fault: Fault): Promise<StartAnswer> {
  const body = StartChatRequest.safeParse(request)
  if (!body.success) return { kind: 'miss', line: couldNot, retry: false }
  const signal = AbortSignal.timeout(startWaitMs)
  try {
    const res = await api.api.chats.$post({ json: body.data }, { init: { signal } })
    return await answerOf(res, fault)
  } catch {
    // No answer in time, or the server or the tailnet cannot be reached: the server may have the start.
    return { kind: 'miss', line: couldNot, retry: true }
  }
}
