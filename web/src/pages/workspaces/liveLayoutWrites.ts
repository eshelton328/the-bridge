// A live chat's layout writes (slice W2, backend #333, #334 and #337): `POST
// /api/chats/:chat/focus` with `{}`, `/zoom` with `{ zoomed }`, `/swap` with
// `{ with: <chat ID> }`, `/close` with `{ confirm: <chat ID> }` and `/move`
// with `{ tab, direction, beside? }`, each answering 204 with no body; `/split` with `{ direction }`, answering 201
// with the new shell's chat ID, which the page does not need; and `POST
// /api/workspaces/:workspace/layout/ratio` with `{ tab, path, ratio }`,
// answering 204. No answer carries a layout: the server's list
// stream sends `layout.changed` for the workspace (and `workspaces.changed`
// after a close, and after a move that closed a tab), and the page reads the layout again on it
// (liveWorkspaces.ts). The page never moves a pane before that.
//
// What a miss means to the page:
// - 409 `chat-not-ready` `singlePane` (a zoom of a tab's only pane) and
//   `otherTab` (a swap with a chat of another tab), and `sameTab` (a move to
//   the chat's own tab): the page's view was stale, so it reads the layout
//   again, quietly (`stale`). `zoomedTab` (a move to a tab herdr zooms) reads
//   it again too, with the line "Not moved — that tab is zoomed".
// - 404: the chat (or a swap's other chat) is gone, or a ratio's tab or
//   split; the page reads the layout again (`gone`).
// - 409 `working` (a close of a chat that works, or whose state herdr cannot
//   tell) and `needsYou` (one that waits for the owner's answer): the close
//   dialog says so (`working`, `needsYou`).
// - Anything else is one quiet line by kind, as a send's line is ("Not
//   zoomed — herdr-unavailable"). report() gets a LayoutWriteMissError for a
//   5xx and for an answer the page does not expect, with the action, the kind
//   and the HTTP status only: never a chat ID, a chat's title or the server's
//   message. The requests go through the typed RPC client with each chat ID
//   URL-encoded once in the path; the bodies are the contract's.
import {
  CloseChatRequest,
  ErrorBody,
  FocusChatRequest,
  MoveChatRequest,
  SetSplitRatioRequest,
  type SplitDirection,
  SplitChatRequest,
  SwapChatsRequest,
  ZoomChatRequest,
} from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** A write the page sends; `unzoom` is a zoom with `zoomed: false`. */
type LayoutWrite = 'focus' | 'zoom' | 'unzoom' | 'swap' | 'close' | 'split' | 'ratio' | 'move'

/** What the page does after a write answered. */
export type WriteAnswer =
  | { readonly kind: 'done' }
  | { readonly kind: 'stale'; readonly line?: string }
  | { readonly kind: 'gone' }
  | { readonly kind: 'working' }
  | { readonly kind: 'needsYou' }
  | { readonly kind: 'miss'; readonly line: string }

/** A layout write that missed, for report(): the action, the kind and the status, and nothing else. */
class LayoutWriteMissError extends Error {
  readonly miss: string

  constructor(action: LayoutWrite, kind: string, status: number | undefined) {
    super(`A layout ${action} missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'LayoutWriteMissError'
    this.miss = kind
  }
}

const lead: Record<LayoutWrite, string> = {
  focus: 'Not focused',
  zoom: 'Not zoomed',
  unzoom: 'Not unzoomed',
  swap: 'Not swapped',
  close: 'Not closed',
  split: 'Not split',
  ratio: 'Not resized',
  move: 'Not moved',
}

const missLine = (action: LayoutWrite, text: string): WriteAnswer => ({
  kind: 'miss',
  line: `${lead[action]} — ${text}`,
})

/** A miss the page reports: a 5xx, or an answer it does not expect. */
function reported(action: LayoutWrite, kind: string, status: number | undefined): WriteAnswer {
  report(new LayoutWriteMissError(action, kind, status), 'live')
  return missLine(action, kind)
}

/** What a write's answer that is not 204 means to the page. */
async function missOf(action: LayoutWrite, res: Response): Promise<WriteAnswer> {
  const parsed = ErrorBody.safeParse(readJson(await res.text()))
  if (!parsed.success) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    if (res.status >= 500) return reported(action, 'unreachable', res.status)
    return reported(action, res.ok ? 'bad-reply' : 'status', res.status)
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'chat-not-ready':
      if (error.state === 'singlePane' || error.state === 'otherTab' || error.state === 'sameTab')
        return { kind: 'stale' }
      if (error.state === 'zoomedTab') return { kind: 'stale', line: `${lead[action]} — that tab is zoomed` }
      if (error.state === 'working') return { kind: 'working' }
      if (error.state === 'needsYou') return { kind: 'needsYou' }
      return reported(action, `${error.kind} ${error.state}`, res.status)
    case 'not-found':
      return { kind: 'gone' }
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      return reported(action, error.kind, res.status)
    case 'too-many-requests':
    case 'forbidden':
      return missLine(action, error.kind)
    case 'invalid-input':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
    case 'workspace-not-ready':
      // The page sends only bodies the contract takes, for a chat it lists: the server's refusal is a bug.
      return reported(action, error.kind, res.status)
  }
}

/** Posts with `call` and gives what its answer means. */
async function post(action: LayoutWrite, call: (signal: AbortSignal) => Promise<Response>): Promise<WriteAnswer> {
  const signal = AbortSignal.timeout(liveReadTimeoutMs)
  let res: Response
  try {
    res = await call(signal)
  } catch {
    // fetch rejects when no answer comes in time, or when the server or the tailnet cannot be reached.
    return missLine(action, signal.aborted ? 'timeout' : 'unreachable')
  }
  // A split answers 201 with the new shell's chat ID; the pane shows when `layout.changed` brings it.
  if (res.status === 204 || (action === 'split' && res.status === 201)) return { kind: 'done' }
  try {
    return await missOf(action, res)
  } catch {
    return missLine(action, signal.aborted ? 'timeout' : 'unreachable')
  }
}

const param = (chat: string) => ({ chat: encodeURIComponent(chat) })

/** Focuses the pane of `chat` (its server ID) in its herdr tab. */
export function focusChat(chat: string): Promise<WriteAnswer> {
  const json = FocusChatRequest.parse({})
  return post('focus', (signal) =>
    api.api.chats[':chat'].focus.$post({ param: param(chat), json }, { init: { signal } }),
  )
}

/** Zooms the pane of `chat` (its server ID) in its tab, or ends the zoom of its tab. */
export function zoomChat(chat: string, zoomed: boolean): Promise<WriteAnswer> {
  const json = ZoomChatRequest.parse({ zoomed })
  return post(zoomed ? 'zoom' : 'unzoom', (signal) =>
    api.api.chats[':chat'].zoom.$post({ param: param(chat), json }, { init: { signal } }),
  )
}

/** Swaps the panes of `chat` and `other` (server IDs) in their tab. */
export function swapChats(chat: string, other: string): Promise<WriteAnswer> {
  const json = SwapChatsRequest.parse({ with: other })
  return post('swap', (signal) => api.api.chats[':chat'].swap.$post({ param: param(chat), json }, { init: { signal } }))
}

/** Closes the pane of `chat` (its server ID), which ends its agent or shell: the owner confirmed it with its name. */
export function closeChat(chat: string): Promise<WriteAnswer> {
  const json = CloseChatRequest.parse({ confirm: chat })
  return post('close', (signal) =>
    api.api.chats[':chat'].close.$post({ param: param(chat), json }, { init: { signal } }),
  )
}

/** Puts a new shell pane to the right of (`row`) or below (`column`) the pane of `chat` (its server ID). */
export function splitChat(chat: string, direction: SplitDirection): Promise<WriteAnswer> {
  const json = SplitChatRequest.parse({ direction })
  return post('split', (signal) =>
    api.api.chats[':chat'].split.$post({ param: param(chat), json }, { init: { signal } }),
  )
}

/**
 * Moves the pane of `chat` (its server ID) to the tab `body.tab` of its workspace, beside the `beside` chat's pane or
 * the tab's focused pane; its chat ID and terminal stay.
 */
export function moveChat(
  chat: string,
  body: { readonly tab: string; readonly direction: SplitDirection; readonly beside?: string },
): Promise<WriteAnswer> {
  const json = MoveChatRequest.parse(body)
  return post('move', (signal) => api.api.chats[':chat'].move.$post({ param: param(chat), json }, { init: { signal } }))
}

/** Gives the split at `path` of tab `tab` of `workspace` (server IDs) the share `ratio`. */
export function setSplitRatio(workspace: string, body: SetSplitRatioRequest): Promise<WriteAnswer> {
  const json = SetSplitRatioRequest.parse(body)
  return post('ratio', (signal) =>
    api.api.workspaces[':workspace'].layout.ratio.$post(
      { param: { workspace: encodeURIComponent(workspace) }, json },
      { init: { signal } },
    ),
  )
}
