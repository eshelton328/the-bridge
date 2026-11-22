// The live list's edits (reviews R41, R42; backend #423): `POST
// /api/workspaces/:workspace/rename` and `POST /api/chats/:chat/rename` with
// `{ name }`, and `POST /api/workspaces/order` with `{ workspaces }`, the
// whole list in the owner's order. Each answers 204 with no body, and the
// server's list stream sends `workspaces.changed`: the page shows the new
// name or order from the list read after it, never before (useWorkspaceEdits.ts).
// A chat's name is herdr's label of its pane, which the list shows as the
// chat's title; the agent's own name does not change.
//
// What a miss means to the page:
// - 409 `workspace-not-ready` `orderStale`: the order does not name the list
//   the server has now, so the page reads the list again, with a line
//   (`stale`).
// - 404: the workspace or the chat is gone; the page reads the list again,
//   with a line (`gone`).
// - 400 `invalid-input`: the server's message as one line. The page sends
//   only a name the contract's `Label` takes, so this is a name the server
//   refuses for its own reason.
// - Anything else is one quiet line by kind ("Not renamed —
//   herdr-unavailable"). report() gets a WorkspaceEditMissError for a 5xx and
//   for an answer the page does not expect, with the action, the kind and
//   the HTTP status only: never a name, an ID or the server's message. The
//   requests go through the typed RPC client with each ID URL-encoded once
//   in the path; the bodies are the contract's.
import { ErrorBody, RenameChatRequest, RenameWorkspaceRequest, WorkspaceOrderRequest } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** An edit the page sends. */
export type WorkspaceEdit = 'renameWorkspace' | 'renameChat' | 'order'

/** What the page does after an edit answered. */
export type EditAnswer =
  | { readonly kind: 'done' }
  | { readonly kind: 'stale'; readonly line: string }
  | { readonly kind: 'gone'; readonly line: string }
  | { readonly kind: 'miss'; readonly line: string }

/** An edit that missed, for report(): the action, the kind and the status, and nothing else. */
class WorkspaceEditMissError extends Error {
  readonly miss: string

  constructor(action: WorkspaceEdit, kind: string, status: number | undefined) {
    super(`A workspace edit (${action}) missed: ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'WorkspaceEditMissError'
    this.miss = kind
  }
}

/** The start of each edit's line. */
export const editLead: Record<WorkspaceEdit, string> = {
  renameWorkspace: 'Not renamed',
  renameChat: 'Not renamed',
  order: 'Not reordered',
}

const missLine = (action: WorkspaceEdit, text: string): EditAnswer => ({
  kind: 'miss',
  line: `${editLead[action]} — ${text}`,
})

/** A miss the page reports: a 5xx, or an answer it does not expect. */
function reported(action: WorkspaceEdit, kind: string, status: number | undefined): EditAnswer {
  report(new WorkspaceEditMissError(action, kind, status), 'live')
  return missLine(action, kind)
}

/** What an edit's answer that is not 204 means to the page. */
async function missOf(action: WorkspaceEdit, res: Response): Promise<EditAnswer> {
  const parsed = ErrorBody.safeParse(readJson(await res.text()))
  if (!parsed.success) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    if (res.status >= 500) return reported(action, 'unreachable', res.status)
    return reported(action, res.ok ? 'bad-reply' : 'status', res.status)
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'workspace-not-ready':
      if (error.state === 'orderStale')
        return { kind: 'stale', line: `${editLead[action]} — the list changed; here it is again` }
      return reported(action, `${error.kind} ${error.state}`, res.status)
    case 'not-found':
      return {
        kind: 'gone',
        line: `${editLead[action]} — that ${action === 'renameChat' ? 'chat' : 'workspace'} is gone`,
      }
    case 'invalid-input':
      // The server's own words, as one line: the name passed the contract's check here.
      return missLine(action, error.message)
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      return reported(action, error.kind, res.status)
    case 'too-many-requests':
    case 'forbidden':
      return missLine(action, error.kind)
    case 'chat-not-ready':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
      return reported(action, error.kind, res.status)
  }
}

/** Posts with `call` and gives what its answer means. */
async function post(action: WorkspaceEdit, call: (signal: AbortSignal) => Promise<Response>): Promise<EditAnswer> {
  const signal = AbortSignal.timeout(liveReadTimeoutMs)
  let res: Response
  try {
    res = await call(signal)
  } catch {
    // fetch rejects when no answer comes in time, or when the server or the tailnet cannot be reached.
    return missLine(action, signal.aborted ? 'timeout' : 'unreachable')
  }
  if (res.status === 204) return { kind: 'done' }
  try {
    return await missOf(action, res)
  } catch {
    return missLine(action, signal.aborted ? 'timeout' : 'unreachable')
  }
}

/** Gives `workspace` (its server ID) the label `name`, as the contract's `Label` takes it. */
export function renameWorkspace(workspace: string, name: string): Promise<EditAnswer> {
  const json = RenameWorkspaceRequest.parse({ name })
  return post('renameWorkspace', (signal) =>
    api.api.workspaces[':workspace'].rename.$post(
      { param: { workspace: encodeURIComponent(workspace) }, json },
      { init: { signal } },
    ),
  )
}

/** Gives the pane of `chat` (its server ID) the label `name`, which the list shows as the chat's title. */
export function renameChat(chat: string, name: string): Promise<EditAnswer> {
  const json = RenameChatRequest.parse({ name })
  return post('renameChat', (signal) =>
    api.api.chats[':chat'].rename.$post({ param: { chat: encodeURIComponent(chat) }, json }, { init: { signal } }),
  )
}

/** Puts the workspaces (server IDs, each of the list once) in `workspaces`' order, first to last. */
export function orderWorkspaces(workspaces: readonly string[]): Promise<EditAnswer> {
  const json = WorkspaceOrderRequest.parse({ workspaces })
  return post('order', (signal) => api.api.workspaces.order.$post({ json }, { init: { signal } }))
}
