// The Toolkit page's view models: what its screens show, display-ready,
// with no API shape behind them (d-082). Each type comes from its Zod
// schema, so the state check and the types have one source.
import { z } from 'zod'

/** The kind of a toolkit item; it picks the card's kind tile and the chip's dot. */
export const ToolkitKind = z.enum(['skill', 'agent', 'rule', 'workflow', 'hook'])
export type ToolkitKind = z.infer<typeof ToolkitKind>

/** One item of toolkit/: a skill, agent, rule, workflow or hook. */
export const ToolkitItemView = z.object({
  kind: ToolkitKind,
  name: z.string(),
  /** Its path in toolkit/, such as "skills/writer/". It is the item's id: two kinds can share a name. */
  path: z.string(),
  description: z.string(),
  /** How many toolkit files it links to (→). */
  linksTo: z.number().int().nonnegative(),
  /** How many toolkit files link to it (←). */
  linkedFrom: z.number().int().nonnegative(),
  /** How many files the item has. */
  files: z.number().int().positive(),
})
export type ToolkitItemView = z.infer<typeof ToolkitItemView>

/** The items of one kind, under their group header ("Skills", shown in capitals). */
export const ToolkitGroupView = z.object({
  kind: ToolkitKind,
  label: z.string(),
  items: z.array(ToolkitItemView),
})
export type ToolkitGroupView = z.infer<typeof ToolkitGroupView>

/** A kind chip: "All" or a kind, with how many items it has. */
export const ToolkitKindChip = z.object({
  value: z.union([z.literal('all'), ToolkitKind]),
  label: z.string(),
  count: z.number().int().nonnegative(),
})
export type ToolkitKindChip = z.infer<typeof ToolkitKindChip>

/** One item on the map (D2): its place in a column and the text at its end. */
export const ToolkitMapNode = z.object({
  /** The item's path in toolkit/, as in `ToolkitItemView.path`; links and the selection name it. */
  path: z.string(),
  name: z.string(),
  kind: ToolkitKind,
  /** The column, from 0 (Rules and hooks) to 3 (Workflows). */
  column: z.number().int().nonnegative(),
  /** The row in its column, from 0 at the top; a column may skip rows. */
  row: z.number().int().nonnegative(),
  /** Short text at the end of the node, such as "every session". */
  meta: z.string().optional(),
})
export type ToolkitMapNode = z.infer<typeof ToolkitMapNode>

/** A line on the map: the file at `from` links to the file at `to`. Each end is an item's path. */
export const ToolkitMapLink = z.object({ from: z.string(), to: z.string() })
export type ToolkitMapLink = z.infer<typeof ToolkitMapLink>

/** The map of the toolkit (D2): one column for each kind, and a line where one file links to another. */
export const ToolkitMapView = z.object({
  /** The column headings, left to right. */
  columns: z.array(z.string()),
  nodes: z.array(ToolkitMapNode),
  links: z.array(ToolkitMapLink),
})
export type ToolkitMapView = z.infer<typeof ToolkitMapView>

/** One line of an open item's file summary (D3 `file · …`): a file, a folder with its count, or a folder's files. */
const ToolkitFileLine = z.object({
  /**
   * A file, a folder, or a file shown as code, such as a hook's script (D9 `file · commit-msg` 433:1633, with
   * icon/code); a folder's line shows its file count after the name.
   */
  type: z.enum(['file', 'folder', 'code']),
  /** The names on the line: one file or folder, or several files of a folder side by side, such as "chat.md". */
  names: z.array(z.string()).min(1),
  /** The number of files in a folder. */
  count: z.number().int().nonnegative().optional(),
  /** Text after a file's name, such as "137 lines" (D7 433:630). */
  meta: z.string().optional(),
})

/**
 * One block of a file rendered read-only, such as a skill's SKILL.md (D3 `rendered markdown`): its title, a
 * heading, a paragraph, or a line of file references in code.
 */
export const ToolkitMarkdownBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('title'), text: z.string() }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('code'), items: z.array(z.string()).min(1) }),
  /** A block of preformatted lines, such as a folder tree (D4 427:650); `text` keeps its line breaks. */
  z.object({ type: z.literal('pre'), text: z.string() }),
])
export type ToolkitMarkdownBlock = z.infer<typeof ToolkitMarkdownBlock>

/**
 * One card of an agent's How it runs section (D7 `fact · Claude` 433:529) or a hook's When it runs section (D9
 * `fact · Event` 433:1541): its icon and label, the value, and a caption under it, such as Claude, opus and "model".
 * The icon names what the card is about: for an agent the model (Claude, Codex), the tools or its own context; for a
 * hook the git event, whether it is on, the rule it enforces and its test.
 */
const ToolkitFact = z.object({
  icon: z.enum(['model', 'tools', 'context', 'event', 'state', 'rule', 'test']),
  label: z.string(),
  value: z.string(),
  caption: z.string(),
  /**
   * Whether the value is a state that is on or off, such as a hook's "Enabled" (D9 `badge · Enabled · icon` 479:21):
   * the value is then drawn as a badge, on in the done colour with a check. None for a card that shows its value as
   * text.
   */
  status: z.enum(['on', 'off']).optional(),
})

/** One piece of a line of code in the preview (D9 433:1586), with the kind that picks its syntax colour. */
const ToolkitCodeSegment = z.object({
  text: z.string(),
  kind: z.enum(['keyword', 'string', 'comment', 'number', 'function']).optional(),
})

/**
 * One step card of a workflow's flow (D8 `step · Runs` 458:25): its mark (the step's number, "?" for a gate, "×" for
 * an end), its title, what it runs in mono (a script, or an agent in the agent kind's colour) and one or two lines of
 * notes. `row` is its place in its phase, from 0 at the top: a phase may leave a row empty (D8 CHECK has no step in
 * row 1). A `gate` (a question the flow stops at) has the needs-you border and title; an `end` (the flow stops) has a
 * dashed needs-you border.
 */
const ToolkitFlowStep = z.object({
  row: z.number().int().nonnegative(),
  mark: z.string(),
  title: z.string(),
  type: z.enum(['step', 'gate', 'end']),
  uses: z.object({ text: z.string(), kind: z.enum(['code', 'agent']) }).optional(),
  notes: z.array(z.string()),
  /** The label on the arrow down from this step to the next step of its phase, such as "no" (D8 458:93). */
  down: z.string().optional(),
})

/**
 * One phase of a workflow's flow (D8 `lane` 458:3, with its label 458:7): its label ("Check", "Grade · in parallel")
 * and its steps. `from` lists the rows an arrow from the phase before comes in at, and `fromLabel` the label over
 * the first of them, such as "yes" (458:92).
 */
const ToolkitFlowPhase = z.object({
  label: z.string(),
  steps: z.array(ToolkitFlowStep).min(1),
  /** Its steps run side by side (D8 GRADE · IN PARALLEL): no arrow joins them. One after another when not set. */
  parallel: z.boolean().optional(),
  from: z.array(z.number().int().nonnegative()).optional(),
  fromLabel: z.string().optional(),
})

/**
 * What a step of How it works uses (D14 `uses · scripts/check` 460:55): a file it reads, a script it runs (`code`) or
 * a toolkit item it starts or loads, by kind. The kind picks the chip's icon.
 */
const ToolkitHowUse = z.object({ label: z.string(), kind: z.union([z.enum(['file', 'code']), ToolkitKind]) })

/**
 * One step of How it works (D14 `step 6` 460:48): its number, its title, what it does, what it uses and, for a step
 * that repeats, until what (D14 `loop` 460:59, "until no fail").
 */
const ToolkitHowStep = z.object({
  number: z.string(),
  title: z.string(),
  description: z.string().optional(),
  uses: z.array(ToolkitHowUse),
  repeats: z.string().optional(),
})

/**
 * How an item works, step by step, from its main file (D14 `how it works` 459:598): a skill's steps from SKILL.md;
 * later an agent's procedure or a hook's checks. The header's label and the file it names, the legend of what a step
 * reads, runs, starts and repeats, when the item loads, the steps in order, an optional shorter path through them and
 * a note on where the steps come from.
 */
const ToolkitHowItWorks = z.object({
  /** The header, such as "How it works · from the 8 steps in"; it shows in capitals. */
  label: z.string(),
  /** The file the steps come from, after the label as it is written, such as "SKILL.md". */
  file: z.string(),
  /** The legend at the header's end (D14 `legend · reads` 459:602): what each icon of a step means. */
  legend: z.array(z.object({ type: z.enum(['reads', 'runs', 'starts', 'repeats']), label: z.string() })),
  /** When the item loads (D14 `trigger` 459:621), such as "Loads when a task writes a doc…". None when not set. */
  trigger: z.string().optional(),
  steps: z.array(ToolkitHowStep).min(1),
  /**
   * A shorter path through the steps (D14 `chat path` 501:62): its title, a line under it and its steps, each the
   * number of the step it keeps (or a mark such as "→" for a step of its own), its name and a note.
   */
  shortPath: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      steps: z.array(z.object({ number: z.string(), label: z.string(), note: z.string().optional() })).min(1),
    })
    .optional(),
  /** Where the steps come from (D14 `source` 459:772), under the rest. */
  note: z.string().optional(),
})

/** A tab of an open item: Overview, How it works, Files, Links, Evals or Activity. */
const ToolkitItemTab = z.object({ value: z.string(), label: z.string() })

/** An item that uses the open item, such as a workflow that runs a skill. */
const ToolkitItemRef = z.object({ path: z.string(), name: z.string(), kind: ToolkitKind })

/**
 * An open item (D3, a rule in D4, an agent in D7, a hook in D9): what the page shows beside the list for one item. Its kind, name and link counts come from
 * the list's `ToolkitItemView` with the same path.
 */
export const ToolkitItemDetailView = z.object({
  /** The item's path in toolkit/, as in `ToolkitItemView.path`. */
  path: z.string(),
  /** The path the badge shows and copies, such as "toolkit/skills/writer/". */
  location: z.string(),
  /** When the item last changed, such as "changed 6 days ago". */
  changed: z.string(),
  /** What the item is for, in full, over the Overview. */
  description: z.string(),
  /**
   * When a rule loads (D4 `when it loads` 427:628), from its paths frontmatter: the label ("Loads when") and the
   * condition, such as "a file under toolkit/skills/** or skills/** changes". None for an item that is not a rule.
   */
  loads: z.object({ label: z.string(), when: z.string() }).optional(),
  /**
   * How an agent runs, from its frontmatter (D7 `kind section · agent` 433:526), or when a hook runs (D9
   * `kind section · hook` 433:1538): the section's label ("How it runs", "When it runs") and its cards, all the same
   * size. None for an item that is not an agent or a hook.
   */
  runs: z.object({ label: z.string(), facts: z.array(ToolkitFact).min(1) }).optional(),
  /**
   * A workflow's steps by phase, from the Mermaid flow in its file (D8 `kind section · workflow` 433:1034): the
   * section's label, the phases left to right, the label of the loop back to the start (D8 `label · new failure`
   * 466:11), the agents it runs, a note after them, such as "Gates in amber; …", and where the steps are when the
   * phone cannot draw them. None for an item that is not a workflow.
   */
  flow: z
    .object({
      label: z.string(),
      phases: z.array(ToolkitFlowPhase).min(1),
      loop: z.string().optional(),
      agents: z.object({ label: z.string(), items: z.array(ToolkitItemRef) }),
      note: z.string().optional(),
      /**
       * Where the steps are when the screen is too narrow to draw them (M21 487:2275, on the phone): "The steps, gates
       * and loop are on How it works." It takes the flow's place under the agents.
       */
      elsewhere: z.string().optional(),
    })
    .optional(),
  /** The How it works tab (D14): the item's steps. None when the item has no such tab yet; its panel is then empty. */
  how: ToolkitHowItWorks.optional(),
  tabs: z.array(ToolkitItemTab).min(1),
  /**
   * The item's main file, rendered read-only: its name, text after the name in the bar (D7 433:567, "137 lines · the
   * prompt"), and its blocks. A file shown as code (a hook's script, D9 `code` 433:1583) has `code` instead: its
   * first lines, each split into its syntax colours, with the line numbers beside them; its `blocks` are then empty.
   */
  preview: z.object({
    file: z.string(),
    meta: z.string().optional(),
    blocks: z.array(ToolkitMarkdownBlock),
    code: z.array(z.array(ToolkitCodeSegment)).optional(),
  }),
  /**
   * The heading of the items that use this one, such as "Used in workflows", and those items. None when the side
   * column does not show it, as for the rule in D4.
   */
  usedIn: z.object({ label: z.string(), items: z.array(ToolkitItemRef) }).optional(),
  /** The item's files: how many, and the lines of the summary. None when the side column does not show them (D4). */
  files: z.object({ count: z.number().int().nonnegative(), lines: z.array(ToolkitFileLine) }).optional(),
  /** The link to the item's evals, with its caption, such as "5 cases · open the Evals tab"; none when not set. */
  evals: z.object({ title: z.string(), caption: z.string(), tab: z.string() }).optional(),
})
export type ToolkitItemDetailView = z.infer<typeof ToolkitItemDetailView>

/** The item open beside the list, as the screen shows it (screens/itemView.ts). */
export type ToolkitOpenItem = {
  item: ToolkitItemView
  detail: ToolkitItemDetailView
  /** The tab shown: `ui.itemTab` when the item has it, else its first tab. */
  tab: string
}

export const ToolkitData = z.object({
  /** The number of items in toolkit/, after the title. */
  count: z.number().int().nonnegative(),
  /** The Inbox items that need Erik, on the rail's Inbox. */
  railBadge: z.number().int().nonnegative(),
  /** The number of artifacts, on Artifacts in the phone's More drawer; without it the item shows no count. */
  artifactsCount: z.number().int().nonnegative().optional(),
  chips: z.array(ToolkitKindChip),
  groups: z.array(ToolkitGroupView),
  /** The map the Map view shows; without it the Map view shows an empty map. */
  map: ToolkitMapView.optional(),
  /** What an open item shows (D3), by path; an item with no entry opens with what the list knows of it. */
  details: z.array(ToolkitItemDetailView).optional(),
})
export type ToolkitData = z.infer<typeof ToolkitData>

/** The views of the page: the cards (List), the map and the activity. */
export const ToolkitView = z.enum(['list', 'map', 'activity'])
export type ToolkitView = z.infer<typeof ToolkitView>

/** The view state a Figma frame shows. */
export const ToolkitUi = z.object({
  view: ToolkitView,
  /** The selected kind chip. */
  filter: ToolkitKindChip.shape.value,
  /** The text in the search field. */
  query: z.string(),
  /** Each group is open unless it is here with false. */
  groupsOpen: z.partialRecord(ToolkitKind, z.boolean()),
  /** Whether the phone's More drawer is open over the tab bar (M4); closed when not set. */
  moreOpen: z.boolean().optional(),
  /** The path of the item selected on the map (D2): its lines light up. None when not set. */
  mapSelected: z.string().nullable().optional(),
  /** The path of the item open beside the list (D3); the list alone when not set or null. */
  open: z.string().nullable().optional(),
  /** The open item's tab, by value; its first tab when not set. */
  itemTab: z.string().optional(),
  /**
   * The path of the item the open item was opened from, through its links (T7): on a tablet or phone the back row
   * shows the breadcrumb Toolkit, that item, the open item, and its crumb goes back to it. None when the list opened it.
   */
  from: z.string().nullable().optional(),
  /**
   * Whether the open workflow's steps fill the page (D8's Open full page; the page is D13, a later frame). Until D13
   * is built the screen shows the item as before. Not open when not set.
   */
  flowFullPage: z.boolean().optional(),
})
export type ToolkitUi = z.infer<typeof ToolkitUi>

/** The schema of one Toolkit state, for the state checks. */
export const ToolkitState = z.object({ data: ToolkitData, ui: ToolkitUi })
