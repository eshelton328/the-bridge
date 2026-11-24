// The live list's edits (reviews R41, R42; backend #423): `POST
// /api/workspaces/:workspace/rename` and `POST /api/chats/:chat/rename` with
// `{ name }`, and `POST /api/workspaces/order` with `{ workspaces }`, the
// whole list in the owner's order. Each answers 204 with no body, and the
// server's list stream sends `workspaces.changed`: the page shows the new
// name or order from the list read after it, never before (useWorkspaceEdits.ts).
// A chat's name is herdr's label of its pane, which the list shows as the
// chat's title; the agent's own name does not change. `POST
// /api/workspaces/:workspace/close` (backend #427) takes `{ confirm, panes }`:
// the workspace's ID and the number of chats the dialog listed. It never
// asks for herdr's group close, and the page offers no force. `POST
// /api/chats/:chat/workspace` (backend #435) takes `{ workspace }` and moves
// the chat's pane to a new tab of that workspace: 200 with `{ chat, pane,
// sourceClosed }`, the chat ID unchanged; the list read after it shows the
// chat in its new workspace and, when `sourceClosed`, the old one gone.
// `POST /api/chats/:chat/fork` (backend #443) takes only a new create ID, so
// the server names the copy "<name>-fork" and splits it beside the chat to
// the right; it answers 201 (or 200 for a create ID it has seen) with the
// contract's `StartChatResponse`, as a start does, and the page follows that
// pane (useForkedChat.ts). The server waits up to 30 s for the chat, so the
// page waits `forkWaitMs`, as New chat does. `POST /api/workspaces` (W4,
// backend #471) takes `{ name? }`, a `Label` or nothing (the server names it
// `defaultWorkspaceName`, "untitled"), and answers 201 with the new workspace
// (`CreateWorkspaceResponse`), one shell in it; its own answers are
// `CreateAnswer`: 400 is the name's line, a 5xx (herdr's 502 and 503, or the
// proxy's for a server that is down) and an unreachable server are lines
// with Retry, and a create that got no answer in time, or a 201 the page
// cannot read, may have made the workspace: `unknown`, whose line says the
// list shows it, and the dialog sends nothing more (PR #489 review).
//
// What a miss means to the page:
// - 409 `workspace-not-ready` `orderStale`: the order does not name the list
//   the server has now, so the page reads the list again, with a line
//   (`stale`).
// - 404: the workspace or the chat is gone; the page reads the list again,
//   with a line (`gone`).
// - 400 `invalid-input`: the server's message as one line. The page sends
//   only a name the contract's `Label` takes, so this is a name the server
//   refuses for its own reason. For a close it is a confirm the server does
//   not match, so the page reads the list again too (`stale`).
// - 409 `workspace-not-ready` for a close, one plain line by state:
//   `working`, `needsYou`, `holdsServer` (the workspace runs the Bridge
//   server) and `group` (herdr groups it); `panesChanged` reads the list
//   again and asks again with the new list (`again`).
// - 409 `chat-not-ready` for a move, one plain line by state: `sameWorkspace`
//   ("It is already in {workspace}", the target's name filled in by the
//   hook), `working`, `needsYou` and `holdsServer`.
// - 409 `chat-not-ready` for a fork, one plain line by state: `noSession`
//   (a Claude chat with no saved turn yet, such as a fresh fork, backend
//   #446; a Codex chat and a shell, which the server refuses so too, have
//   no Fork on the page), `nameTaken` (past "<name>-fork-9") and
//   `folderNotAllowed`. A fork with no answer may have started, so its line
//   says the list shows it if it did.
// - Anything else is one quiet line by kind ("Not renamed —
//   herdr-unavailable"). report() gets a WorkspaceEditMissError for a 5xx and
//   for an answer the page does not expect, with the action, the kind and
//   the HTTP status only: never a name, an ID or the server's message. The
//   requests go through the typed RPC client with each ID URL-encoded once
//   in the path; the bodies are the contract's.
import {
  CloseWorkspaceRequest,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  ErrorBody,
  ForkChatRequest,
  MoveToWorkspaceRequest,
  MoveToWorkspaceResponse,
  RenameChatRequest,
  RenameWorkspaceRequest,
  splitId,
  StartChatResponse,
  WorkspaceOrderRequest,
} from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** An edit the page sends. */
export type WorkspaceEdit =
  | 'renameWorkspace'
  | 'renameChat'
  | 'order'
  | 'close'
  | 'moveChat'
  | 'forkChat'
  | 'createWorkspace'

/** What the page does after an edit answered. */
export type EditAnswer =
  | { readonly kind: 'done' }
  | { readonly kind: 'stale'; readonly line: string }
  | { readonly kind: 'gone'; readonly line: string }
  | { readonly kind: 'again'; readonly line: string }
  | { readonly kind: 'miss'; readonly line: string }

/** A fork's answer: the new chat's pane, its chat ID once Claude has a session, and its state; or why not. */
export type ForkAnswer = EditAnswer | { readonly kind: 'forked'; readonly started: StartChatResponse }

/** How long the page waits for a fork's answer: the server waits 30 s for the chat, and herdr may take longer. */
const forkWaitMs = 75_000

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
  close: 'Not closed',
  moveChat: 'Not moved',
  forkChat: 'Not forked',
  createWorkspace: 'Not made',
}

/** The line of each state a move can meet (409 `chat-not-ready`); "{workspace}" is the target's name. */
const moveLines: Partial<Record<string, string>> = {
  sameWorkspace: 'It is already in {workspace}',
  working: 'It is working — stop it first',
  needsYou: 'It needs you — answer it first',
  holdsServer: 'This chat runs the Bridge server, so it can’t move',
}

/** The line of each state a fork can meet (409 `chat-not-ready`). */
const forkLines: Partial<Record<string, string>> = {
  noSession: 'Not forked — the chat has no saved turn yet; send it a message first',
  nameTaken: 'Not forked — another chat has the fork’s name',
  folderNotAllowed: 'Not forked — the chat’s folder is not allowed for new chats',
}

/** The line of each state a close can meet (409 `workspace-not-ready`), as the owner reads it. */
const closeLines = {
  working: 'A chat in it is working — stop it first',
  needsYou: 'A chat in it needs you',
  holdsServer: 'This workspace runs the Bridge server, so it can’t close from here',
  group: 'Close it in herdr',
} as const

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
      if (action === 'order' && error.state === 'orderStale')
        return { kind: 'stale', line: `${editLead[action]} — the list changed; here it is again` }
      if (action === 'close') {
        if (error.state === 'panesChanged')
          return { kind: 'again', line: `${editLead[action]} — the chats in it changed; here they are again` }
        if (error.state !== 'orderStale') return { kind: 'miss', line: closeLines[error.state] }
      }
      return reported(action, `${error.kind} ${error.state}`, res.status)
    case 'not-found':
      return {
        kind: 'gone',
        line: `${editLead[action]} — that ${
          action === 'renameChat' || action === 'forkChat'
            ? 'chat'
            : action === 'moveChat'
              ? 'chat or workspace'
              : 'workspace'
        } is gone`,
      }
    case 'invalid-input':
      // The server's own words, as one line: the name passed the contract's check here. A close's confirm the server
      // does not match means the page's list is not the server's, so the page reads it again.
      if (action === 'close') return { kind: 'stale', line: `${editLead[action]} — ${error.message}` }
      return missLine(action, error.message)
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      return reported(action, error.kind, res.status)
    case 'too-many-requests':
    case 'forbidden':
      return missLine(action, error.kind)
    case 'chat-not-ready': {
      const line =
        action === 'moveChat' ? moveLines[error.state] : action === 'forkChat' ? forkLines[error.state] : undefined
      return line === undefined ? reported(action, `${error.kind} ${error.state}`, res.status) : { kind: 'miss', line }
    }
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'storage-full':
    case 'inbox-read-only':
      return reported(action, error.kind, res.status)
  }
}

/** The line of an edit that got no answer: a fork may have started all the same. */
const noAnswer = (action: WorkspaceEdit, signal: AbortSignal): EditAnswer =>
  action === 'forkChat'
    ? { kind: 'miss', line: 'Fork sent, no answer — the list shows the chat if it started' }
    : missLine(action, signal.aborted ? 'timeout' : 'unreachable')

/** Posts with `call` and gives what its answer means, waiting `waitMs` for it. */
async function send(
  action: WorkspaceEdit,
  call: (signal: AbortSignal) => Promise<Response>,
  waitMs = liveReadTimeoutMs,
): Promise<ForkAnswer> {
  const signal = AbortSignal.timeout(waitMs)
  let res: Response
  try {
    res = await call(signal)
  } catch {
    // fetch rejects when no answer comes in time, or when the server or the tailnet cannot be reached.
    return noAnswer(action, signal)
  }
  if (res.status === 204) return { kind: 'done' }
  // A move answers 200 with the moved chat, a fork 201 (200 for a create ID the server has seen) with the new chat; any
  // other body is an answer the page does not expect.
  const ok =
    action === 'moveChat' ? res.status === 200 : action === 'forkChat' && (res.status === 200 || res.status === 201)
  if (ok) {
    let body: unknown
    try {
      body = readJson(await res.text())
    } catch {
      return noAnswer(action, signal)
    }
    if (action === 'moveChat' && MoveToWorkspaceResponse.safeParse(body).success) return { kind: 'done' }
    const started = StartChatResponse.safeParse(body)
    if (action === 'forkChat' && started.success) return { kind: 'forked', started: started.data }
    return reported(action, 'bad-reply', res.status)
  }
  try {
    return await missOf(action, res)
  } catch {
    return noAnswer(action, signal)
  }
}
/** Posts an edit that is not a fork: its answer is never a new chat. */
const post = (action: WorkspaceEdit, call: (signal: AbortSignal) => Promise<Response>): Promise<EditAnswer> =>
  send(action, call).then((answer) => (answer.kind === 'forked' ? reported(action, 'bad-reply', 201) : answer))

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

/** Closes `workspace` (its server ID) and its `panes` chats, the number the dialog listed. */
export function closeWorkspace(workspace: string, panes: number): Promise<EditAnswer> {
  const json = CloseWorkspaceRequest.parse({ confirm: workspace, panes })
  return post('close', (signal) =>
    api.api.workspaces[':workspace'].close.$post(
      { param: { workspace: encodeURIComponent(workspace) }, json },
      { init: { signal } },
    ),
  )
}

/** Moves `chat` (its server ID) to a new tab of `workspace` (its server ID); the chat keeps its ID. */
export function moveToWorkspace(chat: string, workspace: string): Promise<EditAnswer> {
  const json = MoveToWorkspaceRequest.parse({ workspace })
  return post('moveChat', (signal) =>
    api.api.chats[':chat'].workspace.$post({ param: { chat: encodeURIComponent(chat) }, json }, { init: { signal } }),
  )
}

/**
 * Forks the Claude chat `chat` (its server ID) beside it, with `createId` and nothing else, so the server names the
 * copy and splits it to the right.
 */
export function forkChat(chat: string, createId: string): Promise<ForkAnswer> {
  const json = ForkChatRequest.parse({ createId })
  return send(
    'forkChat',
    (signal) =>
      api.api.chats[':chat'].fork.$post({ param: { chat: encodeURIComponent(chat) }, json }, { init: { signal } }),
    forkWaitMs,
  )
}

/**
 * A new workspace's answer (W4): `created` with its page ID (the local part of the server's), `name` with the line
 * the name field shows (400), `retry` with a line for a miss the same create may get past (a 5xx, an unreachable
 * server), or `miss` with a line and no Retry.
 */
export type CreateAnswer =
  | { readonly kind: 'created'; readonly workspace: string }
  | { readonly kind: 'name'; readonly line: string }
  | { readonly kind: 'retry'; readonly line: string }
  | { readonly kind: 'miss'; readonly line: string }
  | { readonly kind: 'unknown'; readonly line: string }

/** The line of a create that may have made the workspace. */
const unknownLine = 'Sent, no answer — the list shows the workspace if it was made'

/** How long the page waits for a new workspace: herdr makes it and the server reads the list again before it answers. */
const createWaitMs = 30_000

/** What a create's answer that is not 201 means to the page. */
async function createMissOf(res: Response): Promise<CreateAnswer> {
  const parsed = ErrorBody.safeParse(readJson(await res.text()))
  const lead = editLead.createWorkspace
  if (!parsed.success) {
    const kind = res.status >= 500 ? 'unreachable' : res.ok ? 'bad-reply' : 'status'
    report(new WorkspaceEditMissError('createWorkspace', kind, res.status), 'live')
    return { kind: res.status >= 500 ? 'retry' : 'miss', line: `${lead} — ${kind}` }
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'invalid-input':
      // The server's own words: the name passed the contract's check here, so the server refused it for its own reason.
      return { kind: 'name', line: error.message }
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      report(new WorkspaceEditMissError('createWorkspace', error.kind, res.status), 'live')
      return { kind: 'retry', line: `${lead} — ${error.kind}` }
    case 'too-many-requests':
      return { kind: 'retry', line: `${lead} — ${error.kind}` }
    case 'chat-not-ready':
    case 'forbidden':
    case 'inbox-read-only':
    case 'not-found':
    case 'storage-full':
    case 'too-large':
    case 'unsupported-media':
    case 'upload-conflict':
    case 'workspace-not-ready':
      report(new WorkspaceEditMissError('createWorkspace', error.kind, res.status), 'live')
      return { kind: 'miss', line: `${lead} — ${error.kind}` }
  }
}

/** Makes a workspace with one shell, named `name` (a `Label`), or `defaultWorkspaceName` when it is undefined. */
export async function createWorkspace(name: string | undefined): Promise<CreateAnswer> {
  const json = CreateWorkspaceRequest.parse(name === undefined ? {} : { name })
  const signal = AbortSignal.timeout(createWaitMs)
  let res: Response
  try {
    res = await api.api.workspaces.$post({ json }, { init: { signal } })
  } catch {
    // With no answer in time herdr may have made it; an unreachable server made nothing, so a Retry is safe.
    return signal.aborted
      ? { kind: 'unknown', line: unknownLine }
      : { kind: 'retry', line: `${editLead.createWorkspace} — unreachable` }
  }
  try {
    if (res.status !== 201) return await createMissOf(res)
    const made = CreateWorkspaceResponse.safeParse(readJson(await res.text()))
    if (made.success) return { kind: 'created', workspace: splitId(made.data.workspace.id).local }
    // A 201 the page cannot read made the workspace all the same.
    report(new WorkspaceEditMissError('createWorkspace', 'bad-reply', res.status), 'live')
    return { kind: 'unknown', line: unknownLine }
  } catch {
    return { kind: 'unknown', line: unknownLine }
  }
}
