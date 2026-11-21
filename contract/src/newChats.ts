// Start a new chat from the app (slice W3): `POST /api/chats` starts Claude
// in a new pane beside a chat, or in a new tab of a workspace, and answers
// with its pane and, once Claude has a session, its chat ID. The server
// starts it only in a folder under its chat root, with no flag that skips
// a permission, and answers no prompt of the new chat: a start that waits
// for the owner (such as Claude's folder trust question) is `needsYou`.
import { z } from 'zod'
import { ChatId, PaneId, SendId, WorkspaceId } from './ids.ts'
import { SplitDirection } from './layout.ts'
import { ModelAlias } from './workspaces.ts'

/** A chat's name in herdr and in Claude Code: a small letter, then at most 31 small letters, digits, "-" or "_". */
export const ChatName = z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/)

/**
 * The body of `POST /api/chats`: a Claude chat with an optional name (the server picks one when it has none) and
 * model, in a new pane beside the chat `beside` (in its folder) or in a new tab of `workspace` (in the folder of
 * its first pane), with no focus change; herdr labels a new tab with its next number. `createId` is the page's ID of
 * this start, so a retry starts no second chat.
 */
export const StartChatRequest = z.strictObject({
  kind: z.literal('claude'),
  name: ChatName.optional(),
  model: ModelAlias.optional(),
  place: z.discriminatedUnion('in', [
    z.strictObject({ in: z.literal('split'), beside: ChatId, direction: SplitDirection }),
    z.strictObject({ in: z.literal('tab'), workspace: WorkspaceId }),
  ]),
  createId: SendId.optional(),
})
export type StartChatRequest = z.infer<typeof StartChatRequest>

/**
 * The state of a new chat: `ready` for input, `needsYou` when it waits for the owner's answer in the chat, or
 * `starting` when it was not ready in 30 s; the workspaces list then shows it, by its pane, when it is.
 */
export const StartState = z.enum(['ready', 'needsYou', 'starting'])
export type StartState = z.infer<typeof StartState>

/** The answer to a start (201): the new pane, the chat ID once Claude has a session, and the state. */
export const StartChatResponse = z.strictObject({ pane: PaneId, chat: ChatId.optional(), state: StartState })
export type StartChatResponse = z.infer<typeof StartChatResponse>
