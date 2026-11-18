// The Inbox page's view models: what its screens show, display-ready
// (ages such as '4m', not dates), with no API shape behind them (d-082).
// Each type comes from its Zod schema, so the state check and the types
// have one source.
import { z } from 'zod'
import { InboxItemId } from '@bridge/shared'

/** The kind of an Inbox item; it picks the row's kind tile. */
export const InboxKind = z.enum(['approval', 'question', 'review', 'action', 'next'])

/** A status colour, as the library's group dots and pills take it. */
const InboxTone = z.enum(['working', 'running', 'needsYou', 'idle', 'done', 'danger'])

/** An icon a meta chip can show. */
const InboxChipIcon = z.enum(['folder', 'feature', 'linear', 'file'])

/** The agent behind a chat; it picks the kind mark. */
const InboxAgent = z.enum(['claude', 'codex'])

/** How a finished item ended: done, dismissed, or removed in a discussion. */
const InboxResult = z.enum(['done', 'dismissed', 'removed'])

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
  /**
   * A finished item: how it ended, such as "Allowed once". A dismissed item
   * shows a cross and dim text; a removed one a bin and red text.
   */
  outcome: z.object({ line: z.string(), result: InboxResult }).optional(),
  /** A pill under the meta line, such as "New" on a task a discussion just created. */
  pill: InboxPill.optional(),
  /** The item's tags, which the Filter menu's tag boxes match. */
  tags: z.array(z.string()).optional(),
  /** The item's prompt and notes, which the search matches besides the title and the meta line. */
  text: z.array(z.string()).optional(),
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
})
export type InboxGroupView = z.infer<typeof InboxGroupView>

/** A sort of the list: newest first (the default), oldest first, by project, or by kind. */
export const SortValue = z.enum(['newest', 'oldest', 'project', 'kind'])
export type SortValue = z.infer<typeof SortValue>

const InboxFilterChip = z.object({ value: z.string(), label: z.string(), count: z.number().int().nonnegative() })

/**
 * The Filter menu under the list tools: sections of checkboxes with counts.
 * Which boxes are checked is `InboxUi.filterChecks`. A value is a row's
 * kind, its project (the first part of its meta line) or one of its tags.
 */
const InboxFilterMenu = z.object({
  sections: z.array(
    z.object({
      label: z.string(),
      /** The labels are names from the brain (projects, tags), set in mono; kinds are words, in sans. */
      mono: z.boolean(),
      items: z.array(z.object({ value: z.string(), label: z.string(), count: z.number() })),
    }),
  ),
})
export type InboxFilterMenu = z.infer<typeof InboxFilterMenu>

/**
 * The Sort menu: a heading, the choices with what each does and the word
 * the Sort button shows for it, and a note under them. The first choice is
 * the default; which one applies is `InboxUi.sort`.
 */
const InboxSortMenu = z.object({
  heading: z.string(),
  options: z.array(z.object({ value: SortValue, label: z.string(), description: z.string(), short: z.string() })),
  note: z.string(),
  /** The phone's line under the tools while a sort other than the first applies: "Sorted by" and the sort (M15). */
  applied: z.string(),
  /** The link on that line that brings back the first sort. */
  reset: z.string(),
})
export type InboxSortMenu = z.infer<typeof InboxSortMenu>

/**
 * A search in the list: the query, and the hint about its matches in Done,
 * which the list does not hold. The hint's link selects the Done chip, which
 * shows `done`: the Done list of a state whose groups have no Done days.
 */
const InboxSearch = z.object({
  query: z.string(),
  more: z.object({ text: z.string(), link: z.string() }),
  done: z.array(InboxGroupView),
})

/** The Snooze menu of the task bar and the sheet a long-pressed row opens on the phone: snooze times, then Mark done and Dismiss. */
const InboxSnoozeMenu = z.object({
  heading: z.string(),
  times: z.array(z.object({ value: z.string(), label: z.string(), time: z.string() })),
  pick: z.string(),
  done: z.string(),
  dismiss: z.string(),
})
export type InboxSnoozeMenu = z.infer<typeof InboxSnoozeMenu>

/** A Filter menu section that narrows the list: its label and its checked values. */
export type AppliedSection = { label: string; values: string[] }

/**
 * A toast over the bottom of the list, such as "Created 3 tasks from a discussion" with Undo. `created` names the rows a
 * state draws as created (D18, whose task has no discussion to apply): they show while `InboxUi.proposals.create` is
 * applied, and Undo takes them out, as it takes out the rows of an applied proposal (M22).
 */
const InboxToast = z.object({ text: z.string(), action: z.string(), created: z.array(InboxItemId).optional() })

const InboxMetaChip = z.object({ label: z.string(), icon: InboxChipIcon, issue: z.boolean() })

/** What every item's detail starts with: its status bar and its title block. */
const InboxDetailHead = z.object({
  /** The item's id, as in its row: Snooze and Mark done act on it, whatever the list selects. */
  id: InboxItemId,
  status: z.object({ tone: InboxTone, label: z.string() }),
  /** The mono line beside the status, such as "suggested 2h ago by the planning run". */
  origin: z.string(),
  title: z.string(),
  chips: z.array(InboxMetaChip),
  tags: z.array(z.string()),
  /** Snooze and Dismiss in the task bar; a finished item has neither. */
  actions: z.boolean(),
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
  /** Where it runs, such as "the-bridge · Sonnet 5.5". */
  detail: z.string(),
  /** The folders it can use, after the detail on the desktop and tablet; the phone leaves them out (M2). */
  folders: z.string().optional(),
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

/** One entry of a running chat: a message or a tool line. */
const InboxChatEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({ type: z.literal('assistant'), agent: InboxAgent, name: z.string(), text: z.string() }),
  z.object({ type: z.literal('tool'), name: z.string(), target: z.string(), state: z.enum(['running', 'done']) }),
])
export type InboxChatEntry = z.infer<typeof InboxChatEntry>

const InboxRunning = z.object({
  kind: z.literal('running'),
  /** The item's id, as in its row. */
  id: InboxItemId,
  title: z.string(),
  agent: InboxAgent,
  /**
   * The header's meta: the task's place ("ncc-1701 · f-005 · NCC-28"), when
   * it started ("started 3 min ago in") and the chat ("quiet-nebula ·
   * the-bridge · Sonnet 5.5"). The desktop puts them on one line; the
   * tablet shows the place, then the chat with its agent mark.
   */
  meta: z.object({ task: z.string(), started: z.string(), chat: z.string() }),
  status: InboxPill,
  chat: z.array(InboxChatEntry),
  reply: z.string(),
  model: z.string(),
})
export type InboxRunning = z.infer<typeof InboxRunning>

/** A started next step: the chat it runs or ran in, its state and the two ways to open it. */
const InboxRunCard = z.object({
  agent: InboxAgent,
  title: z.string(),
  status: InboxPill,
  meta: z.string(),
  /** The primary button, such as "Reply here" or "Open chat". */
  open: z.string(),
  /** The secondary button, such as "Open in Workspaces"; on a removed task's card, Restore. */
  openElsewhere: z.string(),
  /** The chat the primary button opens in the inbox (Reply here, M10 to M8); a card without it has no chat to open. */
  chat: InboxRunning.optional(),
})
export type InboxRunCard = z.infer<typeof InboxRunCard>

/** Before Start: where it will run and the Start button; after: the run card. */
const InboxLaunch = z.discriminatedUnion('stage', [
  z.object({
    stage: z.literal('suggested'),
    runIn: InboxRunIn,
    startLabel: z.string(),
    startHint: z.string(),
    /**
     * What Start makes of the task, as D5 and D6 draw it: its status and origin, the run card of its chat, and the
     * line its row shows in the Running group.
     */
    start: z.object({
      status: InboxDetailHead.shape.status,
      origin: z.string(),
      run: InboxRunCard,
      row: InboxRowView.shape.running.unwrap(),
    }),
  }),
  z.object({ stage: z.literal('started'), run: InboxRunCard }),
])

const InboxNextStep = InboxDetailHead.extend({
  kind: z.literal('next'),
  why: z.string(),
  /**
   * `suggested` has Reset and Edit; `sent` (started) and `notRun` (removed
   * before it ran) are read-only. `change` is the line under a prompt that
   * a discussion changed, with Undo. `suggested` is the prompt as it was
   * suggested, and whether it is long, when `text` is Erik's edit of it;
   * Reset brings it back. `long` is about `text`: it ends with "Read the
   * whole prompt".
   */
  prompt: z.object({
    text: z.string(),
    suggested: z.object({ text: z.string(), long: z.boolean() }).optional(),
    long: z.boolean(),
    state: z.enum(['suggested', 'sent', 'notRun']),
    change: z.object({ line: z.string(), undo: z.string() }).optional(),
  }),
  launch: InboxLaunch,
  /**
   * Erik's notes: his note with who wrote it and when, if he wrote one, and
   * the placeholder of the field that adds one; without `add` (a started
   * task on the tablet) the notes are read-only.
   */
  notes: z
    .object({ note: z.object({ text: z.string(), by: z.string() }).optional(), add: z.string().optional() })
    .nullable(),
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

/** One line of a proposed change: taken out or put in. */
const InboxDiffLine = z.object({ change: z.enum(['removed', 'added']), text: z.string() })

/**
 * A change the discussion proposes, by kind: an update of the task (with
 * its diff, proposed or applied), new tasks (each with a checkbox), or the
 * removal of the task (with its reason and the confirm dialog's text).
 * `label` is the block's eyebrow, such as "Proposed · Update this task".
 */
const InboxProposal = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('update'),
    label: z.string(),
    section: z.string(),
    lines: z.array(InboxDiffLine),
    /**
     * What Apply does: the task's new origin, prompt and change line (with
     * Undo), and the block's label and the line that says it is applied.
     */
    apply: z.object({
      label: z.string(),
      note: z.string(),
      origin: z.string(),
      prompt: z.string(),
      change: z.object({ line: z.string(), undo: z.string() }),
    }),
  }),
  z.object({
    kind: z.literal('create'),
    label: z.string(),
    tasks: z.array(z.object({ title: z.string(), meta: z.string(), checked: z.boolean() })),
    alsoRemove: z.object({ label: z.string(), checked: z.boolean() }),
  }),
  z.object({
    kind: z.literal('remove'),
    label: z.string(),
    title: z.string(),
    reasonLabel: z.string(),
    reason: z.string(),
    note: z.string(),
    /** The confirm dialog: its title, the meta line and what happens. */
    confirm: z.object({ title: z.string(), meta: z.string(), text: z.string() }),
    /**
     * The task once removed (D21): its row's line and age in Done, and on its page the status, the origin line and
     * the card that says how it was removed, with Open discussion and Restore.
     */
    removed: z.object({
      line: z.string(),
      age: z.string(),
      status: z.object({ tone: InboxTone, label: z.string() }),
      origin: z.string(),
      run: InboxRunCard,
    }),
  }),
])
export type InboxProposal = z.infer<typeof InboxProposal>

/** The kinds of proposal: an update of the task, new tasks or its removal. */
export const ProposalKind = z.enum(['update', 'create', 'remove'])
export type ProposalKind = z.infer<typeof ProposalKind>

/** What Erik did to a proposal: applied it (Apply, Create, Remove task) or discarded it (Discard, Keep it). */
const InboxDecision = z.enum(['applied', 'discarded'])
export type InboxDecision = z.infer<typeof InboxDecision>

/** One entry of a discussion: an event line, Erik's message, the discussion's reply or a proposal. */
const InboxDiscussionEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('event'), text: z.string() }),
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({ type: z.literal('reply'), name: z.string(), text: z.string() }),
  z.object({ type: z.literal('proposal'), proposal: InboxProposal }),
])
export type InboxDiscussionEntry = z.infer<typeof InboxDiscussionEntry>

/**
 * A discussion of the open task, beside it: its model and context, what it
 * may do, the entries, and the reply box. With no entries it shows `empty`:
 * what it can do and suggested questions.
 */
const InboxDiscussion = z.object({
  title: z.string(),
  model: z.string(),
  /** The share of the context window in use, 0 to 100. */
  context: z.number().min(0).max(100),
  contextLabel: z.string(),
  guard: z.string(),
  entries: z.array(InboxDiscussionEntry),
  empty: z
    .object({
      title: z.string(),
      text: z.string(),
      canLabel: z.string(),
      can: z.array(z.object({ icon: z.enum(['edit', 'plus', 'trash']), text: z.string() })),
      suggestions: z.array(z.string()),
      /** The label over the suggestions, which only the phone shows (M18). */
      tryLabel: z.string(),
    })
    .optional(),
  placeholder: z.string(),
})
export type InboxDiscussion = z.infer<typeof InboxDiscussion>

export const InboxDetailView = z.discriminatedUnion('kind', [InboxNextStep, InboxQuestion, InboxRunning])
export type InboxDetailView = z.infer<typeof InboxDetailView>

export const InboxData = z.object({
  /** The needs-you count on the rail's Inbox item. */
  railBadge: z.number().int().nonnegative(),
  /** The tasks in Needs you, Next steps and Running before filters; the list subtracts what they hide. */
  count: z.number().int().nonnegative(),
  /** The filter chips with their counts before filters, like `count`. */
  filters: z.array(InboxFilterChip),
  sortMenu: InboxSortMenu,
  snoozeMenu: InboxSnoozeMenu,
  search: InboxSearch.optional(),
  filterMenu: InboxFilterMenu,
  /** The groups, newest first, before Erik's sort, search and filters (`InboxUi`). */
  groups: z.array(InboxGroupView),
  detail: InboxDetailView.nullable(),
  /** The open task's discussion; the task bar then shows Discuss. */
  discussion: InboxDiscussion.optional(),
  toast: InboxToast.optional(),
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
  /** The row whose actions sheet is open: a long-press on the phone (M6) opens it; `null` when none is. */
  actionsFor: InboxItemId.nullable(),
  /**
   * The row Erik tapped on a tablet or phone that the mock data has no detail for: its own page, from the row's view,
   * with Back and the row's actions behind ⋯ (screen review R11); `null` when none is open.
   */
  rowOpen: InboxItemId.nullable(),
  /** The whole prompt is open in its dialog. */
  promptOpen: z.boolean(),
  /** The discussion panel is open beside the task; the list hides. */
  discussOpen: z.boolean(),
  /** The started task's chat is open in place of the task: Reply here on its run card opens it, Back closes it. */
  chatOpen: z.boolean(),
  /** The dialog that confirms a proposed removal is open. */
  removeOpen: z.boolean(),
  /** The Sort menu's choice. */
  sort: SortValue,
  /** The Filter menu's checked boxes; they apply to the list when the menu closes. */
  filterChecks: z.array(z.string()),
  /** The checked boxes that apply to the list. A section narrows it only when some, not all, of its boxes are checked. */
  filters: z.array(z.string()),
  /** Items Erik snoozed from the Snooze menu, each with the time it returns, such as "11:40". */
  snoozed: z.array(z.object({ id: InboxItemId, until: z.string() })),
  /**
   * Items Erik finished, in Done now: marked done or dismissed from the task bar, or removed in a discussion,
   * each with how it ended.
   */
  finished: z.array(z.object({ id: InboxItemId, result: InboxResult })),
  /** What Erik did to each proposal of the discussion, by its kind; a proposal without one waits. */
  proposals: z.partialRecord(ProposalKind, InboxDecision),
  /** The boxes of a proposal Erik checked or cleared, by label; the others keep the proposal's own. */
  proposalChecks: z.record(z.string(), z.boolean()),
  /** The prompt the task showed when Erik applied a proposed update, with his edits; Undo brings it back. */
  promptBeforeApply: z.string().nullable(),
  /** The messages Erik sent in the open task's discussion, in order; each follows the discussion's entries. */
  sent: z.array(z.string()),
  /** The next steps Erik started with Start: each shows the run card its launch's `start` holds. */
  started: z.array(InboxItemId),
})
export type InboxUi = z.infer<typeof InboxUi>

/** Takes an item out of the list: snoozed until a time, or finished (marked done or dismissed). */
export type InboxPutAway = (
  id: InboxItemId,
  to: { until: string } | { result: InboxUi['finished'][number]['result'] },
) => void

/** The schema of one Inbox state, for the state checks. */
export const InboxState = z.object({ data: InboxData, ui: InboxUi })

// The text Erik types in the open item: his note, his answer's note, the
// prompt he edits, his reply and his reply in the task's discussion. InboxScreen keeps it above the layout, so
// a width change that swaps the desktop and tablet layouts, and with them
// the fields, keeps what he typed.

/** A text field of the open item that keeps what Erik types. */
export type InboxDraftField = 'note' | 'answer' | 'prompt' | 'reply' | 'discussion'

export type InboxDrafts = {
  values: Partial<Record<InboxDraftField, string>>
  onChange: (field: InboxDraftField, value: string) => void
}

/**
 * The value props of `field`'s text field: controlled from `drafts`, starting
 * at `initial`; without `drafts`, uncontrolled from `initial`.
 */
export function draftProps(
  drafts: InboxDrafts | undefined,
  field: InboxDraftField,
  initial = '',
): { value?: string; defaultValue?: string; onValueChange?: (value: string) => void } {
  if (drafts === undefined) return { defaultValue: initial }
  return {
    value: drafts.values[field] ?? initial,
    onValueChange: (value) => {
      drafts.onChange(field, value)
    },
  }
}
