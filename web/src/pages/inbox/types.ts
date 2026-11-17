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

/** The agent behind a chat; it picks the kind mark. */
const InboxAgent = z.enum(['claude', 'codex'])

/** A status pill: with a dot it is a status ("Needs you"), without one a label ("Recommended"). */
const InboxPill = z.object({ tone: InboxTone, label: z.string(), dot: z.boolean() })
export type InboxPill = z.infer<typeof InboxPill>

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
  /** A snoozed item: when it returns, such as "Snoozed until tomorrow 9:00". */
  snoozed: z.object({ line: z.string(), age: z.string() }).optional(),
  /** A started item: the chat it runs in and what it does, and its status. */
  running: z.object({ agent: InboxAgent, line: z.string(), status: InboxPill }).optional(),
  /** A finished item: how it ended, such as "Allowed once". A dismissed item shows a cross and dim text. */
  outcome: z.object({ line: z.string(), dismissed: z.boolean() }).optional(),
})
export type InboxRowView = z.infer<typeof InboxRowView>

export const InboxGroupId = z.enum(['needsYou', 'nextSteps', 'snoozed', 'running', 'today', 'yesterday'])
export type InboxGroupId = z.infer<typeof InboxGroupId>

export const InboxGroupView = z.object({
  id: InboxGroupId,
  label: z.string(),
  count: z.number().int().nonnegative(),
  dot: InboxTone.nullable(),
  rows: z.array(InboxRowView),
  /** With the sort by project: the same rows under a heading per project, in this order. */
  projects: z.array(z.object({ label: z.string(), rows: z.array(InboxRowView) })).optional(),
})
export type InboxGroupView = z.infer<typeof InboxGroupView>

const InboxFilterChip = z.object({ value: z.string(), label: z.string(), count: z.number().int().nonnegative() })

/** The Filter menu under the list tools: sections of checkboxes with counts. */
const InboxFilterMenu = z.object({
  sections: z.array(
    z.object({
      label: z.string(),
      /** The labels are names from the brain (projects, tags), set in mono; kinds are words, in sans. */
      mono: z.boolean(),
      items: z.array(z.object({ value: z.string(), label: z.string(), count: z.number(), checked: z.boolean() })),
    }),
  ),
  note: z.string(),
})
export type InboxFilterMenu = z.infer<typeof InboxFilterMenu>

/** The Sort menu: a heading, the choices with what each does, and a note under them. */
const InboxSortMenu = z.object({
  heading: z.string(),
  options: z.array(z.object({ value: z.string(), label: z.string(), description: z.string() })),
  selected: z.string(),
  note: z.string(),
})
export type InboxSortMenu = z.infer<typeof InboxSortMenu>

/** A search in the list: the query, the line that sums up the results and the hint about matches in Done. */
const InboxSearch = z.object({
  query: z.string(),
  summary: z.string(),
  more: z.object({ text: z.string(), link: z.string() }),
})

/** The Snooze menu of the task bar: snooze times, then Mark done and Dismiss. */
const InboxSnoozeMenu = z.object({
  heading: z.string(),
  times: z.array(z.object({ value: z.string(), label: z.string(), time: z.string() })),
  pick: z.string(),
  done: z.string(),
  dismiss: z.string(),
})

const InboxMetaChip = z.object({ label: z.string(), icon: InboxChipIcon, issue: z.boolean() })

/** What every item's detail starts with: its status bar and its title block. */
const InboxDetailHead = z.object({
  status: z.object({ tone: InboxTone, label: z.string() }),
  /** The mono line beside the status, such as "suggested 2h ago by the planning run". */
  origin: z.string(),
  title: z.string(),
  chips: z.array(InboxMetaChip),
  tags: z.array(z.string()),
  /** Snooze and Dismiss in the task bar; a finished item has neither. */
  actions: z.boolean(),
  snoozeMenu: InboxSnoozeMenu.optional(),
})
export type InboxDetailHead = z.infer<typeof InboxDetailHead>

/** One choice of the Run in picker. */
const InboxRunChoice = z.object({
  value: z.string(),
  /** The agent the chat runs; without one the row starts a chat elsewhere and shows a plus. */
  agent: InboxAgent.optional(),
  label: z.string(),
  description: z.string().optional(),
  pill: InboxPill.optional(),
})

const InboxRunIn = z.object({
  title: z.string(),
  badge: z.string(),
  detail: z.string(),
  /** The Change picker's choices, in sections; the first section has no label. */
  picker: z
    .object({
      search: z.string(),
      sections: z.array(z.object({ label: z.string(), choices: z.array(InboxRunChoice) })),
      selected: z.string(),
      note: z.string(),
    })
    .optional(),
})
export type InboxRunIn = z.infer<typeof InboxRunIn>

/** A started next step: the chat it runs or ran in, its state and the two ways to open it. */
const InboxRunCard = z.object({
  agent: InboxAgent,
  title: z.string(),
  status: InboxPill,
  meta: z.string(),
  /** The primary button, such as "Reply here" or "Open chat". */
  open: z.string(),
  /** The secondary button, such as "Open in Workspaces". */
  openElsewhere: z.string(),
})
export type InboxRunCard = z.infer<typeof InboxRunCard>

/** Before Start: where it will run and the Start button; after: the run card. */
const InboxLaunch = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('suggested'), runIn: InboxRunIn, startLabel: z.string(), startHint: z.string() }),
  z.object({ stage: z.literal('started'), run: InboxRunCard }),
])

const InboxNextStep = InboxDetailHead.extend({
  kind: z.literal('next'),
  why: z.string(),
  /** A sent prompt is read-only: it has no Reset or Edit. */
  prompt: z.object({ text: z.string(), edited: z.boolean(), long: z.boolean(), sent: z.boolean() }),
  launch: InboxLaunch,
  notes: z.object({ text: z.string(), by: z.string(), add: z.string() }).nullable(),
  sources: z.array(z.object({ label: z.string(), detail: z.string() })),
})
export type InboxNextStep = z.infer<typeof InboxNextStep>

const InboxQuestion = InboxDetailHead.extend({
  kind: z.literal('question'),
  waiting: z.object({ agent: InboxAgent, title: z.string(), detail: z.string() }),
  context: z.string(),
  options: z.array(
    z.object({ value: z.string(), label: z.string(), description: z.string(), recommended: z.boolean() }),
  ),
  selected: z.string(),
  noteLabel: z.string(),
  note: z.string(),
  answerLabel: z.string(),
  answerHint: z.string(),
})
export type InboxQuestion = z.infer<typeof InboxQuestion>

/** One entry of a running chat: a message or a tool line. */
const InboxChatEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({ type: z.literal('assistant'), agent: InboxAgent, name: z.string(), text: z.string() }),
  z.object({ type: z.literal('tool'), name: z.string(), target: z.string(), state: z.enum(['running', 'done']) }),
])
export type InboxChatEntry = z.infer<typeof InboxChatEntry>

const InboxRunning = z.object({
  kind: z.literal('running'),
  title: z.string(),
  agent: InboxAgent,
  meta: z.string(),
  status: InboxPill,
  chat: z.array(InboxChatEntry),
  reply: z.string(),
  model: z.string(),
})
export type InboxRunning = z.infer<typeof InboxRunning>

export const InboxDetailView = z.discriminatedUnion('kind', [InboxNextStep, InboxQuestion, InboxRunning])
export type InboxDetailView = z.infer<typeof InboxDetailView>

export const InboxData = z.object({
  /** The needs-you count on the rail's Inbox item. */
  railBadge: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  countLabel: z.string(),
  filters: z.array(InboxFilterChip),
  sort: z.string(),
  /** A sort other than the default applies; the Sort button shows it pressed. */
  sortActive: z.boolean(),
  sortMenu: InboxSortMenu.optional(),
  search: InboxSearch.optional(),
  filterMenu: InboxFilterMenu.optional(),
  groups: z.array(InboxGroupView),
  detail: InboxDetailView.nullable(),
})
export type InboxData = z.infer<typeof InboxData>

/** The view state a Figma frame shows. */
export const InboxUi = z.object({
  filter: z.string(),
  selectedId: InboxItemId.nullable(),
  groupsOpen: z.record(InboxGroupId, z.boolean()),
  /** The Filter menu is open. */
  filterOpen: z.boolean(),
  /** The suggested prompt is in its editor. */
  editingPrompt: z.boolean(),
  /** The Run in picker is open. */
  pickerOpen: z.boolean(),
  /** The Sort menu is open. */
  sortOpen: z.boolean(),
  /** The Snooze menu of the task bar is open. */
  snoozeOpen: z.boolean(),
  /** The whole prompt is open in its dialog. */
  promptOpen: z.boolean(),
})
export type InboxUi = z.infer<typeof InboxUi>

/** The schema of one Inbox state, for the state checks. */
export const InboxState = z.object({ data: InboxData, ui: InboxUi })
