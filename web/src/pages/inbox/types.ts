// The Inbox page's view models: what its screens show, display-ready
// (ages such as '4m', not dates), with no API shape behind them (d-082).
// Each type comes from its Zod schema, so the state check and the types
// have one source.
import { z } from 'zod'
import { InboxItemId } from '@bridge/shared'

/** The kind of an Inbox item; it picks the row's kind tile. */
const InboxKind = z.enum(['approval', 'question', 'review', 'action', 'next'])

/** A status colour, as the library's group dots and pills take it. */
const InboxTone = z.enum(['working', 'running', 'needsYou', 'idle', 'done', 'danger'])

/** An icon a meta chip can show. */
const InboxChipIcon = z.enum(['folder', 'feature', 'linear', 'file'])

export const InboxRowView = z.object({
  id: InboxItemId,
  kind: InboxKind,
  title: z.string(),
  meta: z.string(),
  age: z.string(),
  /** What the item blocks, such as "Codex is waiting". */
  blocks: z.string().nullable(),
  /** An approval shows Allow once, Deny and Open chat in the row. */
  approval: z.boolean(),
})
export type InboxRowView = z.infer<typeof InboxRowView>

export const InboxGroupId = z.enum(['needsYou', 'nextSteps', 'snoozed'])
export type InboxGroupId = z.infer<typeof InboxGroupId>

const InboxGroupView = z.object({
  id: InboxGroupId,
  label: z.string(),
  count: z.number().int().nonnegative(),
  dot: InboxTone,
  rows: z.array(InboxRowView),
})

const InboxFilterChip = z.object({ value: z.string(), label: z.string(), count: z.number().int().nonnegative() })

const InboxMetaChip = z.object({ label: z.string(), icon: InboxChipIcon, issue: z.boolean() })

export const InboxDetailView = z.object({
  status: z.object({ tone: InboxTone, label: z.string() }),
  suggested: z.string(),
  title: z.string(),
  chips: z.array(InboxMetaChip),
  tags: z.array(z.string()),
  why: z.string(),
  prompt: z.string(),
  runIn: z.object({ title: z.string(), badge: z.string(), detail: z.string() }),
  startLabel: z.string(),
  startHint: z.string(),
  notes: z.string(),
  sources: z.array(InboxMetaChip),
})
export type InboxDetailView = z.infer<typeof InboxDetailView>

export const InboxData = z.object({
  /** The needs-you count on the rail's Inbox item. */
  railBadge: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  countLabel: z.string(),
  filters: z.array(InboxFilterChip),
  groups: z.array(InboxGroupView),
  detail: InboxDetailView.nullable(),
})
export type InboxData = z.infer<typeof InboxData>

/** The view state a Figma frame shows. */
export const InboxUi = z.object({
  filter: z.string(),
  selectedId: InboxItemId.nullable(),
  groupsOpen: z.record(InboxGroupId, z.boolean()),
})
export type InboxUi = z.infer<typeof InboxUi>

/** The schema of one Inbox state, for the state checks. */
export const InboxState = z.object({ data: InboxData, ui: InboxUi })
