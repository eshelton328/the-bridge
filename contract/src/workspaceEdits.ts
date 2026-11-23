// The Workspaces page's edit actions (R41, R42): rename a workspace or a
// chat, close a workspace, keep the owner's order of workspaces and chats,
// move a chat to another workspace, and fork a Claude chat. Each request is
// a strict object with no path or flag. A write sends `workspaces.changed`
// on `/api/events`, and a move also `layout.changed` for both workspaces.
import { z } from 'zod'
import { ChatId, PaneId, SendId, WorkspaceId } from './ids.ts'
import { SplitDirection } from './layout.ts'
import { ChatName } from './newChats.ts'

/** The most characters of a workspace's or a shell's name. */
export const maxLabel = 64

/** Characters that a name may not hold: the C0 and C1 control characters and DEL. */
const control = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}-${String.fromCharCode(159)}]`,
)

/** A name as the owner types it: trimmed, 1 to `maxLabel` characters, no control character. */
export const Label = z
  .string()
  .trim()
  .min(1)
  .max(maxLabel)
  .refine((s) => !control.test(s), 'no control characters')

/** The body of `POST /api/workspaces/:workspace/rename`: herdr's workspace label (204). */
export const RenameWorkspaceRequest = z.strictObject({ name: Label })
export type RenameWorkspaceRequest = z.infer<typeof RenameWorkspaceRequest>

/**
 * The body of `POST /api/chats/:chat/rename` (204): herdr's label of the chat's pane, which the list shows as the
 * chat's title before the agent's own title. An agent's herdr name does not change, so it stays a `ChatName`.
 */
export const RenameChatRequest = z.strictObject({ name: Label })
export type RenameChatRequest = z.infer<typeof RenameChatRequest>

/**
 * The body of `POST /api/workspaces/:workspace/close`, which closes each pane of the workspace and so ends each
 * agent and shell in it (204). It cannot be undone, so the page lists the chats that close and asks first:
 * `confirm` is the workspace's ID and `panes` the number of chats the page listed. The server refuses with 409
 * `workspace-not-ready` when a chat in it works or waits for the owner, when the count is not the server's, when it
 * holds the server's own processes or the coordinator's chat, or when herdr groups it with worktree workspaces.
 */
export const CloseWorkspaceRequest = z.strictObject({ confirm: WorkspaceId, panes: z.number().int().positive() })
export type CloseWorkspaceRequest = z.infer<typeof CloseWorkspaceRequest>

const unique = (ids: readonly string[]) => new Set(ids).size === ids.length

/**
 * The body of `POST /api/workspaces/order`: the owner's order of the workspaces, first to last (204). It must name
 * each workspace of the list once (409 `workspace-not-ready` `orderStale` otherwise). Herdr's own order does not
 * change. When the server reads the order, it drops a workspace that is gone and puts a new one last.
 */
export const WorkspaceOrderRequest = z.strictObject({
  workspaces: z.array(WorkspaceId).min(1).refine(unique, 'each workspace once'),
})
export type WorkspaceOrderRequest = z.infer<typeof WorkspaceOrderRequest>

/**
 * The body of `POST /api/workspaces/:workspace/order`: the owner's order of the workspace's chats in the list (204),
 * with the same rules as the workspace order. The panes in the terminal do not move.
 */
export const ChatOrderRequest = z.strictObject({ chats: z.array(ChatId).min(1).refine(unique, 'each chat once') })
export type ChatOrderRequest = z.infer<typeof ChatOrderRequest>

/**
 * The body of `POST /api/chats/:chat/workspace`: move the chat's pane to a new tab of another workspace. A chat that
 * works or waits for the owner is 409 `chat-not-ready`, so no turn breaks, and its own workspace `sameWorkspace`.
 * A chat of a workspace that holds the server or the coordinator's chat is `holdsServer`.
 */
export const MoveToWorkspaceRequest = z.strictObject({ workspace: WorkspaceId })
export type MoveToWorkspaceRequest = z.infer<typeof MoveToWorkspaceRequest>

/**
 * The answer to a move (200): herdr gives the pane a new ID; the chat ID stays, and the page follows it.
 * `sourceClosed` is true when the chat was the last pane of its workspace, which herdr then closes.
 */
export const MoveToWorkspaceResponse = z.strictObject({
  chat: ChatId,
  pane: z.strictObject({ from: PaneId, to: PaneId }),
  sourceClosed: z.boolean(),
})
export type MoveToWorkspaceResponse = z.infer<typeof MoveToWorkspaceResponse>

/**
 * The body of `POST /api/chats/:chat/fork`: start a Claude chat in a new pane beside this one, in its folder, from a
 * copy of its session (`claude --resume <session> --fork-session`), through the start of `POST /api/chats`. Its
 * name is "<name>-fork" when not set. A chat whose session the server does not know is 409 `chat-not-ready`
 * `noSession`. The answer is a `StartChatResponse` (201).
 */
export const ForkChatRequest = z.strictObject({
  name: ChatName.optional(),
  direction: SplitDirection.optional(),
  createId: SendId.optional(),
})
export type ForkChatRequest = z.infer<typeof ForkChatRequest>
