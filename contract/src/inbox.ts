// The Inbox (R20, f-003): what waits on the owner. A chat item is a chat
// that needs the owner or finished a turn, for that turn only. A brain item
// is an open or snoozed attention request in the brain's project inboxes,
// read-only here. Next steps, suggested prompts and discussions have no
// source yet. No prompt or transcript text, and no path: a record's text
// goes only in the detail body.
import { z } from 'zod'
import { ChatId, InboxId, WorkspaceId } from './ids.ts'

/** The most characters of a title. */
export const maxInboxTitle = 200
/** The most characters of a brain record's text in a detail. */
export const maxInboxBody = 65_536

/** Where an item comes from: a chat's status, or an attention request in the brain. */
export const InboxSource = z.enum(['chat', 'brain'])
export type InboxSource = z.infer<typeof InboxSource>

/** The kind of an item, as its row's tile shows it. A chat that needs the owner is a question; a done chat a review. */
export const InboxKind = z.enum(['approval', 'question', 'review', 'action'])
export type InboxKind = z.infer<typeof InboxKind>

/** What the owner can do to an item. A brain item takes none here; its record changes in the brain. */
export const InboxAction = z.enum(['snooze', 'done', 'dismiss'])
export type InboxAction = z.infer<typeof InboxAction>

/** A project's folder name, such as "ncc-1701". */
const InboxProject = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)

/**
 * The chat that filed a brain request, from the record's `origin_machine` and `origin_session`: its chat ID and
 * whether that chat is in this machine's workspace list now. A chat that is not live is `live: false`, never an
 * error.
 */
export const InboxOrigin = z.strictObject({ chat: ChatId, live: z.boolean() })
export type InboxOrigin = z.infer<typeof InboxOrigin>

/** One item of the Inbox. */
export const InboxItem = z
  .strictObject({
    id: InboxId,
    source: InboxSource,
    kind: InboxKind,
    title: z.string().min(1).max(maxInboxTitle),
    project: InboxProject.nullable(),
    /** The record's tags, such as "global/review" or "project/ncc-1701/the-bridge"; none for a chat item. */
    tags: z.array(z.string().max(100)).max(20),
    /** It waits on the owner now: a chat that needs the owner, or an open request. The tab badge counts these. */
    needsYou: z.boolean(),
    /** When it returns to the list; null when it is not snoozed. */
    snoozedUntil: z.iso.datetime().nullable(),
    /** For a chat item the end of its turn, for a brain item the record's `created`. */
    createdAt: z.iso.datetime(),
    /** The chat of a chat item; null for a brain item. */
    chat: ChatId.nullable(),
    /** The chat that filed a brain item; null for a chat item, a record with no origin, or one from another machine. */
    origin: InboxOrigin.nullable(),
    /** A brain item's project workspace: the live workspace the server maps to its project; else null, as for a chat item. */
    workspace: WorkspaceId.nullable(),
    /** What the owner can do to it here; the page hides the rest. */
    actions: z.array(InboxAction),
  })
  .refine((i) => (i.source === 'chat') === (i.chat !== null), {
    message: 'a chat item names its chat, and a brain item none',
    path: ['chat'],
  })
  .refine((i) => i.source === 'brain' || i.origin === null, {
    message: 'only a brain item has an origin chat',
    path: ['origin'],
  })
  .refine((i) => i.source === 'brain' || i.workspace === null, {
    message: 'only a brain item has a project workspace',
    path: ['workspace'],
  })
  .refine((i) => i.source === 'chat' || i.actions.length === 0, {
    message: 'a brain item is read-only here',
    path: ['actions'],
  })
export type InboxItem = z.infer<typeof InboxItem>

/** The response of `GET /api/inbox`: the items, newest first, and the counts. */
export const InboxResponse = z.strictObject({
  items: z.array(InboxItem),
  counts: z.strictObject({
    /** The items that wait on the owner: the tab badge. */
    needsYou: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
})
export type InboxResponse = z.infer<typeof InboxResponse>

/** The detail of one item: its chat as the workspace list has it now, or its record's text. */
export const InboxDetail = z.discriminatedUnion('source', [
  z.strictObject({
    source: z.literal('chat'),
    /** null when the chat is no longer in the workspace list. */
    chat: z
      .strictObject({ chat: ChatId, workspace: WorkspaceId, title: z.string(), model: z.string().nullable() })
      .nullable(),
  }),
  z.strictObject({
    source: z.literal('brain'),
    /** The record's Markdown after its front matter. */
    body: z.string().max(maxInboxBody),
  }),
])
export type InboxDetail = z.infer<typeof InboxDetail>

/** The response of `GET /api/inbox/:item`. */
export const InboxDetailResponse = z
  .strictObject({ item: InboxItem, detail: InboxDetail })
  .refine((r) => r.item.source === r.detail.source, { message: "the detail is of the item's source", path: ['detail'] })
export type InboxDetailResponse = z.infer<typeof InboxDetailResponse>

/** The body of `POST /api/inbox/:item/snooze`: when the item returns. */
export const SnoozeInboxRequest = z.strictObject({ until: z.iso.datetime() })
export type SnoozeInboxRequest = z.infer<typeof SnoozeInboxRequest>

/** The body of `POST /api/inbox/:item/done` and `/dismiss`. */
export const InboxActionRequest = z.strictObject({})
export type InboxActionRequest = z.infer<typeof InboxActionRequest>
