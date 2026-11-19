// The events of `GET /api/events`, the server-sent event stream (d-112).
// The server sends them while a client is connected; with no client it
// reads nothing. A client reads the workspaces again each time the stream
// opens, so an event lost while it was closed does no harm.
import { z } from 'zod'
import { eventOf } from './events.ts'
import { ChatId } from './ids.ts'
import { ChatStatus } from './workspaces.ts'

/** A chat's status changed. */
export const ChatStatusEvent = eventOf('chat.status', z.object({ chat: ChatId, status: ChatStatus }))
export type ChatStatusEvent = z.infer<typeof ChatStatusEvent>

/**
 * The list of workspaces or chats changed (a workspace or chat came, went,
 * moved or was renamed), or the server could not tell what changed: read
 * `GET /api/workspaces` again.
 */
export const WorkspacesChangedEvent = eventOf('workspaces.changed', z.object({}))
export type WorkspacesChangedEvent = z.infer<typeof WorkspacesChangedEvent>

/** One event of the stream. Its `type` is also the SSE event name, and its `seq` the SSE id. */
export const LiveEvent = z.discriminatedUnion('type', [ChatStatusEvent, WorkspacesChangedEvent])
export type LiveEvent = z.infer<typeof LiveEvent>
