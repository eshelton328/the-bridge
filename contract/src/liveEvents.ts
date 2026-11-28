// The events of `GET /api/events`, the server-sent event stream (d-112).
// The server sends them while a client is connected; with no client it
// reads nothing. A client reads the workspaces again each time the stream
// opens, so an event lost while it was closed does no harm.
import { z } from 'zod'
import { eventOf } from './events.ts'
import { ChatId, WorkspaceId } from './ids.ts'
import { ArchitectureScope } from './architecture.ts'
import { ProjectSlug } from './projects.ts'
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

/**
 * The tabs or panes of a workspace changed (a tab or pane came, went, moved or was renamed, a split was
 * resized, or the focus moved): read `GET /api/workspaces/:workspace/layout` again. A `workspaces.changed`
 * event can also change a layout.
 */
export const LayoutChangedEvent = eventOf('layout.changed', z.object({ workspace: WorkspaceId }))
export type LayoutChangedEvent = z.infer<typeof LayoutChangedEvent>

/** The Inbox changed (a chat's turn ended or a brain request changed): read `GET /api/inbox` again. */
export const InboxChangedEvent = eventOf('inbox.changed', z.object({}))
export type InboxChangedEvent = z.infer<typeof InboxChangedEvent>

/** A toolkit's files changed: read `GET /api/toolkit` again. */
export const ToolkitChangedEvent = eventOf('toolkit.changed', z.object({}))
export type ToolkitChangedEvent = z.infer<typeof ToolkitChangedEvent>

/** A project's open PRs changed (NCC-156): read `GET /api/projects/:slug` again. */
export const ProjectsChangedEvent = eventOf('projects.changed', z.object({}))
export type ProjectsChangedEvent = z.infer<typeof ProjectsChangedEvent>
/** A QA launch of the project started, ran, failed or stopped: read `GET /api/projects/:slug/qa` again. */
export const QaChangedEvent = eventOf('qa.changed', z.object({ project: ProjectSlug }))
export type QaChangedEvent = z.infer<typeof QaChangedEvent>
/** A project's Queue changed (a priority write or a Move to Linear): read `GET /api/projects/:slug/queue` again. */
export const QueueChangedEvent = eventOf('queue.changed', z.strictObject({ slug: ProjectSlug }))
export type QueueChangedEvent = z.infer<typeof QueueChangedEvent>

/** A diagram run of a project's scope ended, good or failed: read `GET /api/projects/:slug/architecture` again. */
export const ArchitectureChangedEvent = eventOf(
  'architecture.changed',
  z.strictObject({ slug: ProjectSlug, scope: ArchitectureScope }),
)
export type ArchitectureChangedEvent = z.infer<typeof ArchitectureChangedEvent>

/** One event of the stream. Its `type` is also the SSE event name, and its `seq` the SSE id. */
export const LiveEvent = z.discriminatedUnion('type', [
  ArchitectureChangedEvent,
  ChatStatusEvent,
  InboxChangedEvent,
  LayoutChangedEvent,
  ProjectsChangedEvent,
  QaChangedEvent,
  QueueChangedEvent,
  ToolkitChangedEvent,
  WorkspacesChangedEvent,
])
export type LiveEvent = z.infer<typeof LiveEvent>
