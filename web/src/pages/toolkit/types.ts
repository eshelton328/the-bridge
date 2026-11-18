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
 * the first of them, such as "yes" (458:92). `sources` lists the rows of the phase before that the arrows leave from:
 * an arrow goes from each of them into each row of `from`, straight when the rows are the same and an elbow when they
 * differ (466:6 from Blinding, row 2, up into steps 4 and 5; 466:7 from steps 4 and 5 into step 6). Each arrow leaves
 * at the row it comes in at when not set.
 */
const ToolkitFlowPhase = z.object({
  label: z.string(),
  steps: z.array(ToolkitFlowStep).min(1),
  /** Its steps run side by side (D8 GRADE · IN PARALLEL): no arrow joins them. One after another when not set. */
  parallel: z.boolean().optional(),
  from: z.array(z.number().int().nonnegative()).optional(),
  fromLabel: z.string().optional(),
  sources: z.array(z.number().int().nonnegative()).optional(),
})

/**
 * One step of a workflow's page (D13 `step · Primary grades` 447:31): D8's step card with no row, and an id that the
 * page selects it by. `then` is a line in amber after the notes, such as "Then G1 and G6" (447:16): what runs after the
 * step. `fields` is what the selected step's panel shows (D13 `panel · step 4` 446:621): each field's label and value,
 * the value in mono for a command (446:628). A step with no fields shows only the panel's hint.
 */
const ToolkitPageStep = ToolkitFlowStep.omit({ row: true, down: true }).extend({
  id: z.string(),
  then: z.string().optional(),
  fields: z.array(z.object({ label: z.string(), value: z.string(), mono: z.boolean().optional() })).optional(),
})

/**
 * A workflow's steps on a page of their own (D13 `panel · flow` 446:515 and `row · details` 446:620), from the Mermaid
 * flow and the steps table: the header's label and legend, the stages in order (a stage of two or more steps runs them
 * in parallel, D13 steps 4 and 5), the way out of a gate (D13 `no` 447:85 to `stop · skill-eval-cases` 447:68), the
 * loop back to it (`new failure` 447:86, under the step `under`), the hint of the selected step's panel, the gates and
 * the rounds in the ledgers. On a tablet (T8) the page has no stop box, loop label, hint, gates or rounds.
 */
const ToolkitFlowPage = z.object({
  label: z.string(),
  legend: z.array(z.object({ type: z.enum(['gate', 'script', 'agent', 'person']), label: z.string() })),
  stages: z.array(z.array(ToolkitPageStep).min(1).max(2)).min(1),
  /** The gate's way out: the step it leaves, the arrow's label, the stop's text and the workflow the stop runs. */
  exit: z.object({ from: z.string(), label: z.string(), text: z.string(), workflow: z.string() }).optional(),
  loop: z.object({ label: z.string(), under: z.string() }).optional(),
  /** The hint at the end of the selected step's panel (D13 446:625); T8 has none. */
  hint: z.string().optional(),
  /** The gates' panel (D13 446:647); T8 shows only the selected step's panel under the flow. */
  gates: z.object({ label: z.string(), items: z.array(z.object({ title: z.string(), text: z.string() })) }).optional(),
  /** The rounds' panel (D13 446:658); none on T8. */
  rounds: z
    .object({
      label: z.string(),
      source: z.string(),
      items: z.array(z.object({ name: z.string(), date: z.string() })),
      note: z.string().optional(),
    })
    .optional(),
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
 * reads, runs, starts and repeats, when the item loads, the steps in order, an optional shorter path through them,
 * what happens elsewhere instead (a rule in Codex, D37) and a note on where the steps come from.
 */
const ToolkitHowItWorks = z.object({
  /** The header, such as "How it works · from the 8 steps in"; it shows in capitals. */
  label: z.string(),
  /**
   * The file the steps come from, after the label as it is written, such as "SKILL.md". None when the label names its
   * sources itself (D37 495:399, "… from the paths frontmatter and link.sh", all in capitals).
   */
  file: z.string().optional(),
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
  /**
   * What happens elsewhere instead of the steps, in one line under them (D37 `chat path` 495:525): a label in capitals,
   * such as "In Codex", and the text after it.
   */
  elsewhere: z.object({ label: z.string(), text: z.string() }).optional(),
  /** Where the steps come from (D14 `source` 459:772), under the rest. */
  note: z.string().optional(),
  /**
   * On a tablet or the phone, the back row names the item (Toolkit › writer, T10 461:244) and the kind badge and path
   * rows are left out (T10, M12). When not set the tab keeps the item's header as on the Overview (T36 495:1803).
   */
  named: z.boolean().optional(),
})

/**
 * A folder or file in the Files tab's tree (D6 `tree · references/` 432:2151, `tree · check` 432:2213): its path in
 * the item (unique, what the tab selects it by), its name, whether it is a file, a folder or a script (`code`, D6
 * icon/code 432:2214), a count at the row's end (a folder's files, a file's lines, "5 cases"), a line under the name
 * that says what the file or folder is for (D6 `role · references/` 432:2159, "Read on demand") and a folder's
 * contents.
 */
export type ToolkitFileNode = {
  path: string
  name: string
  type?: 'file' | 'folder' | 'code' | undefined
  count?: number | string | undefined
  caption?: string | undefined
  children?: ToolkitFileNode[] | undefined
}
const ToolkitFileNode: z.ZodType<ToolkitFileNode> = z.object({
  path: z.string(),
  name: z.string(),
  type: z.enum(['file', 'folder', 'code']).optional(),
  count: z.union([z.number().int().nonnegative(), z.string()]).optional(),
  caption: z.string().optional(),
  get children() {
    return z.array(ToolkitFileNode).optional()
  },
})

/**
 * A script explained in plain English (D10 `explain` 440:1423), the default view of a script that has one: what it
 * does (`overview` 440:1424), its facts such as In, Out and Exit (`io · In` 440:1427), each step with the line it
 * explains (`walkthrough` 440:1437) and a note on who wrote it (`generated` 440:1480). The library's
 * `ScriptExplanation` draws it.
 */
const ToolkitFileExplain = z.object({
  summary: z.string(),
  facts: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  steps: z.array(z.object({ text: z.string(), line: z.number().int().positive().optional() })).min(1),
  note: z.string().optional(),
})

/**
 * One file as the Files tab's viewer shows it (D6 `viewer` 432:2290): the path in the bar (`scripts/check`), text after
 * it (D6 432:2295, "Python · 437 lines · run, not read"), the file's first lines as code, each split into its syntax
 * colours, or its blocks rendered read-only, and a line under it on what uses the file (D6 `used by` 432:2347), with
 * the icon of the kind of item that uses it.
 */
const ToolkitFileView = z.object({
  /** The node's path in the tree that this view shows. */
  path: z.string(),
  meta: z.string().optional(),
  blocks: z.array(ToolkitMarkdownBlock),
  code: z.array(z.array(ToolkitCodeSegment)).optional(),
  usedBy: z.object({ kind: ToolkitKind, text: z.string() }).optional(),
  /** A script's explanation (D10); a script with one and `code` opens on it, with the Explain and Code switch. */
  explain: ToolkitFileExplain.optional(),
  /**
   * The blocks summarise a file that is not Markdown, such as a script's header comment (T35 `rendered markdown`
   * 494:4338): drawn rendered with no Rendered and Source switch, since they have no source of their own.
   */
  summary: z.literal(true).optional(),
  /** A line under the source on a file's own page on the phone (M6 435:555), such as how its long lines wrap. */
  footnote: z.string().optional(),
  /**
   * Parts of the file's source past its first lines, each from the number of its first line: the lines that the
   * items' links name (D19, "SKILL.md:118"), which a tap on a link opens (`sourceAt` in blocks/filesView.ts).
   */
  excerpts: z.array(z.object({ start: z.number().int().positive(), lines: z.array(z.string()).min(1) })).optional(),
})
export type ToolkitFileView = z.infer<typeof ToolkitFileView>

/**
 * The Files tab of an open item (D6 `file browser` 432:2141): the item's folders and files as a tree, the folders open
 * at first, the file selected at first (`ui.file` overrides it) and what the viewer shows of each file it knows. A
 * file with no view shows its bar only.
 */
const ToolkitFileBrowser = z.object({
  tree: z.array(ToolkitFileNode).min(1),
  expanded: z.array(z.string()),
  selected: z.string(),
  views: z.array(ToolkitFileView),
  /**
   * On a tablet or phone the Files tab's path row (T4 `path row` 457:169) names the item's folder in the toolkit
   * ("skills/writer/") and how many files it has ("11 files"), in place of where the item is and when it changed; a
   * file on its own page (T6 457:178) shows the folder and the file's path in the badge. The item's own path row when
   * not set.
   */
  badge: z.object({ path: z.string(), meta: z.string() }).optional(),
})
export type ToolkitFileBrowser = z.infer<typeof ToolkitFileBrowser>

/**
 * One link of the Links tab (D19 `link · writing · rules/writing.md:77` 482:547): the item at the other end (its path,
 * name and kind), where the link is written (`at`, the file and its line, such as "rules/writing.md:77") and the line
 * itself, cut as Figma cuts it.
 */
const ToolkitLink = z.object({
  path: z.string(),
  name: z.string(),
  kind: ToolkitKind,
  at: z.string(),
  text: z.string(),
})

/**
 * One side of the Links tab (D19 `panel · linked from` 482:542): its label ("Linked from", shown in capitals with the
 * count after it), the caption at the header's end ("files that name writer"), the links in the file's order, and the
 * order of the items in the graph's column (`graph`, their paths). With no links, `empty` says why, in the graph's
 * column (`graph`, D29 493:895) and in the panel (`panel`, D29 493:901).
 */
const ToolkitLinkSide = z.object({
  label: z.string(),
  caption: z.string(),
  links: z.array(ToolkitLink),
  graph: z.array(z.string()),
  empty: z.object({ graph: z.string(), panel: z.string() }).optional(),
})

/**
 * The Links tab (D19 `links` 482:539): a line on what it shows, the header's label ("Links", with the count of the
 * links) and hint, the items that link to this one and the items it links to, and the note under them.
 */
const ToolkitLinks = z.object({
  intro: z.string(),
  label: z.string(),
  hint: z.string(),
  from: ToolkitLinkSide,
  to: ToolkitLinkSide,
  note: z.string(),
  /**
   * On a tablet, the back row names the item (Toolkit › writer, T15 482:724) and the kind badge and path rows are left
   * out, as on How it works (T10). When not set the tab keeps the item's header as on the Overview (T28 493:3264).
   */
  named: z.boolean().optional(),
})
export type ToolkitLinks = z.infer<typeof ToolkitLinks>

/**
 * A badge of the Evals tab's status panel (D20 `badge · D1 Quality` 482:1901): a done criterion or a test run and its
 * state. `pass` is drawn in the done colour with a check, `fail` in the danger colour with a cross in a circle, and
 * `waits` (a criterion not measured yet, D20 `badge · D6` 482:1923) in the needs-you colour with no icon. `open` is the
 * path of the item whose Evals tab holds the criterion's results (D5 Reviewer, the agent writing-reviewer, D26): a tap
 * on the badge opens that item there.
 */
const ToolkitEvalBadge = z.object({
  label: z.string(),
  state: z.enum(['pass', 'fail', 'waits']),
  open: z.string().optional(),
})

/**
 * One row of a panel that lists rounds (D20 `round · r7` 482:1987): its name, the meta after it (the date, the runs and
 * the cost) and a line under them. The rule's ledgers (D25 `round · writer` 492:506) and the workflow's gates (D27
 * `round · Before step 1` 492:1677) use the same row. `open` is the path of the toolkit item the row names (a ledger's
 * skill): a tap on the name opens that item on its Evals tab.
 */
const ToolkitEvalRound = z.object({
  name: z.string(),
  meta: z.string(),
  text: z.string(),
  open: z.string().optional(),
})

/**
 * The text at the end of a rounds panel's header: the count of its rows and a noun (D25 492:489, "4 ledgers"), a link
 * to another tab of the item (D27 492:1660, "from the file" opens Files) or a link to a file outside the toolkit that
 * no frame draws yet (D20 482:1986, "Open the ledger"), which waits for a design and is disabled.
 */
const ToolkitEvalsEnd = z.discriminatedUnion('type', [
  z.object({ type: z.literal('count'), noun: z.string() }),
  z.object({ type: z.literal('tab'), label: z.string(), tab: z.string() }),
  z.object({ type: z.literal('waits'), label: z.string() }),
])

/**
 * A line of text with pass and fail marks in it (D28 492:2185: Figma's ✓ and ✗ in the hook's test line): plain text, or
 * its runs, each a string or a mark, which the line draws as the library's check or cross icon with "pass" or "fail"
 * as its accessible text.
 */
const ToolkitMarkedText = z.union([
  z.string(),
  z.array(z.union([z.string(), z.object({ mark: z.enum(['pass', 'fail']) })])),
])

/**
 * The Evals tab of an open item (D20 `evals` 482:1894), from the item's ledger, its cases or its tests: the status
 * panel (its label in capitals, the text at the header's end, the badges and a line on what they mean), the pass rate
 * by round as grouped bars (`chart`, D20 `panel · opus by round` 482:1927), the cases with their scores (`cases`, D20
 * `panel · cases` 482:1956; the count follows the label), the rounds (`rounds`, D20 `panel · rounds` 482:1982) and the
 * source under them. An item with no evals has only a status panel that says so, and the rows that stand in for them:
 * the ledgers that cite a rule (D25), a workflow's gates (D27) or a hook's test groups (D28).
 */
const ToolkitEvals = z.object({
  status: z.object({
    label: z.string(),
    meta: z.string().optional(),
    badges: z.array(ToolkitEvalBadge).optional(),
    text: ToolkitMarkedText,
  }),
  chart: z
    .object({
      label: z.string(),
      meta: z.string(),
      /** The series, one bar in each group: with the skill (cyan) and without it (grey). */
      series: z.array(z.object({ name: z.string() })).min(1),
      groups: z.array(z.object({ label: z.string(), values: z.array(z.number().nonnegative()) })).min(1),
      /** The value of a full-height bar (100, a pass rate in percent). */
      max: z.number().positive(),
      note: z.string(),
    })
    .optional(),
  cases: z
    .object({
      label: z.string(),
      meta: z.string(),
      rows: z.array(z.object({ name: z.string(), value: z.string() })).min(1),
      note: z.string().optional(),
    })
    .optional(),
  rounds: z
    .object({ label: z.string(), end: ToolkitEvalsEnd.optional(), items: z.array(ToolkitEvalRound).min(1) })
    .optional(),
  source: z.string(),
  /**
   * On a tablet or the phone, the back row names the item (Toolkit › writer, T16 482:2066) and the kind badge and path
   * rows are left out, as on How it works (T10). When not set the tab keeps the item's header (T24 492:2381).
   */
  named: z.boolean().optional(),
})
export type ToolkitEvals = z.infer<typeof ToolkitEvals>

/**
 * A panel of bars on the Activity tab (D17 `panel · by day` 474:602, `panel · where` 474:620): its label in capitals,
 * the note at its header's end ("Oct 31 to Nov 15", "from the session folder"), one row for each day or place with
 * its count, and an optional line under the rows ("No calls on the other 13 days.").
 */
const ToolkitActivityBars = z.object({
  label: z.string(),
  meta: z.string(),
  rows: z.array(z.object({ label: z.string(), value: z.number().int().nonnegative() })).min(1),
  note: z.string().optional(),
})

/**
 * A row of the Activity tab's list (D17 `row · Linear workflow setup for NCC team` 474:650): a chat that loaded the
 * item (`chat`, after the chat icon) or a round from a ledger (`round`, D23 `row · readme · cross-family x1`, no icon),
 * its title and the line under it. `open` is the path of the toolkit item the row names (a round's skill): a tap opens
 * that item on its Evals tab. A chat opens in the chat panel of the Activity view (D18), which no state draws yet, so a
 * chat row has no `open` and takes no tap.
 */
const ToolkitActivityRow = z.object({
  type: z.enum(['chat', 'round']),
  title: z.string(),
  meta: z.string(),
  open: z.string().optional(),
})

/**
 * The Activity tab of an open item (D17 `activity` 474:583), from the Claude Code session files: four key figures
 * (`kpis`, each its value, label and caption), the counts by day (`byDay`), where it ran (`where`; a hook's reasons it
 * rejected, D24), the chats that loaded it or the ledgers' rounds (`list`) and the source under them.
 */
const ToolkitActivity = z.object({
  kpis: z.array(z.object({ value: z.string(), label: z.string(), caption: z.string() })).length(4),
  byDay: ToolkitActivityBars,
  where: ToolkitActivityBars,
  list: z.object({ label: z.string(), meta: z.string(), rows: z.array(ToolkitActivityRow).min(1) }),
  source: z.string(),
  /**
   * On a tablet or the phone, the back row names the item (Toolkit › writer, T13 474:738) and the kind badge and path
   * rows are left out, as on How it works (T10). When not set the tab keeps the item's header (T20 491:6668).
   */
  named: z.boolean().optional(),
})
export type ToolkitActivity = z.infer<typeof ToolkitActivity>

/** A tab of an open item: Overview, How it works, Files, Links, Evals or Activity. */
const ToolkitItemTab = z.object({ value: z.string(), label: z.string() })

/** An item that uses the open item, such as a workflow that runs a skill. */
const ToolkitItemRef = z.object({ path: z.string(), name: z.string(), kind: ToolkitKind })

/**
 * An open item (D3, a rule in D4, an agent in D7, a hook in D9): what the page shows beside the list for one item. Its kind, name and link counts come from
 * the list's `ToolkitItemView` with the same path.
 */
/** One message of an item's discussion (D5): Erik's question, or Claude's answer with the files it cites. */
export const ToolkitDiscussEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({
    type: z.literal('reply'),
    /** Who answers, such as "Claude". */
    name: z.string(),
    text: z.string(),
    /** The files and lines the answer cites, such as "skills/writer/SKILL.md:106". */
    sources: z.array(z.string()),
    /** The label of the button that copies the answer, such as "Copy". */
    copy: z.string(),
  }),
])
export type ToolkitDiscussEntry = z.infer<typeof ToolkitDiscussEntry>

/**
 * An item's discussion (D5, T5, M7): a read-only chat about the item. Nothing in it changes the toolkit; Open in
 * Workbench moves the chat to a workspace, where it can change files.
 */
export const ToolkitDiscussion = z.object({
  /** The title, such as "Discuss" (D5 438:6). */
  title: z.string(),
  /** The label of the button that moves the chat to the Workbench: "Open in Workbench", or "Workbench" (M7). */
  openInWorkbench: z.string(),
  /** What the discussion is for, under the desktop panel's title (D5 438:15); none on a tablet or phone. */
  note: z.string().optional(),
  /** The item's folder, attached read-only (D5 `context` 438:16); none on a tablet or phone. */
  attached: z.object({ text: z.string(), readOnly: z.string() }).optional(),
  /** The pill that says what the chat is, such as "Discussion" (T5 464:331). */
  badge: z.string(),
  /** The model the chat runs, such as "Opus 5.5". */
  model: z.string(),
  /** How much of the context window it uses, in per cent (T5 464:316); none when the frame does not show it. */
  context: z.number().int().min(0).max(100).optional(),
  /** The label after the meter, such as "context". */
  contextLabel: z.string(),
  /**
   * The item's card on a tablet or phone (T5 `task · discussing`): its kind's pill ("Skill"), its meta line and what
   * the chat may do.
   */
  card: z.object({ kind: z.string(), meta: z.string(), guard: z.string() }),
  /**
   * The open item's title and description layers in the frame that draws it beside the discussion (D5 432:1461 and
   * 432:1462); the item's own frame's layers when not set.
   */
  itemLayers: z.object({ title: z.string(), description: z.string() }).optional(),
  /** The reply box's placeholder, such as "Ask about writer". */
  placeholder: z.string(),
  /** The messages; with none, the empty state. */
  entries: z.array(ToolkitDiscussEntry),
  /** Before the first message (T5 `empty state` 464:350): what to ask, what the chat can do and questions to start with. */
  empty: z.object({
    title: z.string(),
    text: z.string(),
    canLabel: z.string(),
    can: z.array(z.object({ icon: z.enum(['book', 'links', 'external']), text: z.string() })),
    /** The label over the suggestions when they stack, such as "Try" (M7 464:206). */
    tryLabel: z.string().optional(),
    suggestions: z.array(z.string()),
  }),
})
export type ToolkitDiscussion = z.infer<typeof ToolkitDiscussion>

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
  /**
   * A workflow's page (D13): its How it works tab when the workflow opens on a page of its own, without the list
   * (`ui.flowFullPage`). None for an item that is not a workflow.
   */
  flowPage: ToolkitFlowPage.optional(),
  /** The Files tab (D6): the item's tree and its file viewer. None when the item has no such tab yet; its panel is then empty. */
  browser: ToolkitFileBrowser.optional(),
  /** The Links tab (D19): what links to the item and what it links to. None when the item has no such tab yet. */
  links: ToolkitLinks.optional(),
  /**
   * The Evals tab (D20): the item's results from its ledger, or what stands in for them when it has no eval cases (D25
   * to D28). None when the item has no such tab yet; its panel is then empty. The Overview's `evals` is the link to it.
   */
  results: ToolkitEvals.optional(),
  /** The Activity tab (D17): how often the item ran, where, and the chats that loaded it. None when not drawn yet. */
  activity: ToolkitActivity.optional(),
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
  /**
   * The item's discussion, which its Discuss button opens, by layout: the desktop's side panel (D5), the tablet's page
   * (T5) and the phone's (M7) each have their own text. A layout with none takes the desktop's; an item with none has
   * no discussion, and Discuss does nothing.
   */
  discuss: z.partialRecord(z.enum(['desktop', 'tablet', 'phone']), ToolkitDiscussion).optional(),
})
export type ToolkitItemDetailView = z.infer<typeof ToolkitItemDetailView>

/** The item open beside the list, as the screen shows it (screens/itemView.ts). */
export type ToolkitOpenItem = {
  item: ToolkitItemView
  detail: ToolkitItemDetailView
  /** The tab shown: `ui.itemTab` when the item has it, else its first tab. */
  tab: string
}

/**
 * Where the sessions of the Activity view started (D11 `source · segmented` 444:491): all of them, the chats (the CLI
 * and the desktop app, T11) or the headless runs (`claude -p` and the SDK, T12).
 */
export const ToolkitActivitySource = z.enum(['all', 'chats', 'headless'])
export type ToolkitActivitySource = z.infer<typeof ToolkitActivitySource>

/** One value of an open run and where it comes from (D12 `field · Session` 445:483). */
const ToolkitRunField = z.object({ label: z.string(), value: z.string(), source: z.string() })

/** One step of an open run (D12 `step · 0:00` 445:521): when, the tool, what it did; `now` is the step running. */
const ToolkitRunStep = z.object({ time: z.string(), name: z.string(), text: z.string(), now: z.boolean().optional() })

/**
 * What an open run shows (D12 `side panel · run` 445:465): the line under its name, its values with their sources, its
 * steps and what its result will show. `layers` are the Figma keys D12 gives the page's header and the panel's header
 * and button, whose names the frame uses twice.
 */
const ToolkitRunDetail = z.object({
  summary: z.string(),
  fields: z.array(ToolkitRunField).min(1),
  stepsLabel: z.string(),
  steps: z.array(ToolkitRunStep).min(1),
  resultLabel: z.string(),
  result: z.string(),
  layers: z.object({ pageHeader: z.string(), header: z.string(), openSession: z.string() }).optional(),
})

/**
 * A run in progress (D11 `run · writing-reviewer` 444:526): the item that runs, by its kind, name and path, the line
 * under it, its chips (the project, the feature; none on a tablet or phone), how long it has run and what its panel
 * shows; a run with no `detail` opens with what its row says (no frame draws it yet). `id` keys it in `ui.run`.
 */
const ToolkitRun = z.object({
  id: z.string(),
  kind: ToolkitKind,
  name: z.string(),
  path: z.string(),
  meta: z.string(),
  chips: z.array(z.string()).optional(),
  elapsed: z.string(),
  detail: ToolkitRunDetail.optional(),
})
export type ToolkitRun = z.infer<typeof ToolkitRun>

/** A series of the calls per day (D11 `chart · Headless runs` 444:586): its name and one count for each day. */
const ToolkitDailySeries = z.object({
  name: z.string(),
  source: ToolkitActivitySource.exclude(['all']),
  values: z.array(z.number().int().nonnegative()).min(1),
})

/** An item of Most called (D11 `bar · writer` 444:638): the item, by its kind, name and path, and its calls. */
const ToolkitCalledItem = z.object({ kind: ToolkitKind, name: z.string(), path: z.string(), value: z.number() })

/** A line of the log (D11 `log · 01:16:40` 444:694): when, the kind of the item, and what happened. */
const ToolkitLogLine = z.object({ time: z.string(), kind: ToolkitKind, text: z.string() })

/** A toolkit item a chat used (D15 `link · writing-reviewer` 477:544): the item and how many times, when more than once. */
const ToolkitChatItem = z.object({
  kind: ToolkitKind,
  name: z.string(),
  path: z.string(),
  times: z.number().int().optional(),
})
export type ToolkitChatItem = z.infer<typeof ToolkitChatItem>

/** A tool a chat called (D18 `tool · Bash` 475:429): how many times and its name. */
const ToolkitChatTool = z.object({ count: z.number().int().nonnegative(), name: z.string() })

/**
 * What an open chat shows (D18 `side panel · chat` 475:373): its status badge, the line under its name, its values
 * (each with where it comes from, except on the phone, M16 475:1144), the label over the items it used and the label
 * over the tools it used, with their counts. `layers` are the Figma keys D18 gives the page's header and the panel's
 * header and button, whose names the frame uses more than once.
 */
const ToolkitChatDetail = z.object({
  status: z.string(),
  summary: z.string(),
  fields: z.array(z.object({ label: z.string(), value: z.string(), source: z.string().optional() })).min(1),
  itemsLabel: z.string(),
  toolsLabel: z.string(),
  tools: z.array(ToolkitChatTool).min(1),
  layers: z.object({ pageHeader: z.string(), header: z.string(), openSession: z.string() }).optional(),
})
export type ToolkitChatDetail = z.infer<typeof ToolkitChatDetail>

/**
 * A chat that used the toolkit (D15 `chat · Linear workflow setup for NCC team` 477:520): its title, when and where it
 * ran, the items it used (each opens its page) and what its panel shows (D18); a chat with no `detail` opens with what
 * its row says. `id` keys it in `ui.chat`.
 */
const ToolkitActivityChat = z.object({
  id: z.string(),
  title: z.string(),
  meta: z.string(),
  items: z.array(ToolkitChatItem).min(1),
  detail: ToolkitChatDetail.optional(),
})
export type ToolkitActivityChat = z.infer<typeof ToolkitActivityChat>

/**
 * The headless sessions one skill eval started (D16 `eval · writer` 477:1122): the skill (its chip opens its page; a
 * folder with no skill has none, T12 `eval · readme-reads folder` 477:1936), the word after the chip, its toolkit
 * calls, its sessions and how many loaded an item (the bar is that share) and the line under the bar.
 */
const ToolkitEvalGroup = z.object({
  name: z.string(),
  skill: z.object({ kind: ToolkitKind, path: z.string() }).optional(),
  after: z.string().optional(),
  calls: z.string(),
  sessions: z.number().int().positive(),
  loaded: z.number().int().nonnegative(),
  meta: z.string(),
})
export type ToolkitEvalGroup = z.infer<typeof ToolkitEvalGroup>

/**
 * The list of a source of the Activity view, beside Most called on the desktop: the chats that used the toolkit
 * (D15 477:515) or the headless sessions by skill eval (D16 477:1117). `shown` rows show at first; Show all, in the
 * header on the desktop and under the rows elsewhere, shows every row, and waits (disabled) while the state knows
 * fewer rows than its `count`.
 */
const ToolkitActivityList = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chats'),
    label: z.string(),
    shown: z.number().int().positive(),
    showAll: z.object({ label: z.string(), count: z.number().int().positive() }).optional(),
    /** The button of an open chat, such as "Open the session in Workbench" (D18 475:386). */
    openSession: z.string(),
    rows: z.array(ToolkitActivityChat).min(1),
  }),
  z.object({
    type: z.literal('evals'),
    label: z.string(),
    shown: z.number().int().positive(),
    showAll: z.object({ label: z.string(), count: z.number().int().positive() }).optional(),
    rows: z.array(ToolkitEvalGroup).min(1),
  }),
])
export type ToolkitActivityList = z.infer<typeof ToolkitActivityList>

/**
 * What the Activity view counts for one source (All, Chats or Headless): four key figures (a caption under each on the
 * desktop only), the runs in progress, the calls per day (one chart per series, the days under the last), the most
 * called items, the log (the desktop only) and the source line (the desktop only). Each panel has its label and the
 * note at its header's end; the tablet and the phone write the runs' label and note as one line (`T9` 449:262) and
 * the hint under the runs.
 */
const ToolkitActivityCounts = z.object({
  kpis: z.array(z.object({ value: z.string(), label: z.string(), caption: z.string().optional() })).length(4),
  running: z.object({
    label: z.string(),
    meta: z.string(),
    hint: z.string().optional(),
    /** The open run's status badge, such as "Running" (D12 `badge · Running · icon` 479:14). */
    status: z.string(),
    /** The row's button that opens the run, such as "Open session" (D11 444:540); none on a tablet or phone. */
    open: z.string().optional(),
    /** The open run's button, such as "Open the session in Workbench" (D12 445:478). */
    openSession: z.string(),
    rows: z.array(ToolkitRun),
  }),
  perDay: z.object({
    label: z.string(),
    meta: z.string(),
    /** The days, oldest first, each its date and its label on the axis. */
    days: z.array(z.object({ date: z.string(), label: z.string() })).min(1),
    series: z.array(ToolkitDailySeries).min(1),
  }),
  mostCalled: z.object({
    label: z.string(),
    meta: z.string().optional(),
    /** The label in the panel's Figma key when it differs from the label (D15 `panel · MOST CALLED` 477:339). */
    layer: z.string().optional(),
    rows: z.array(ToolkitCalledItem),
  }),
  log: z.object({ label: z.string(), meta: z.string(), rows: z.array(ToolkitLogLine) }).optional(),
  /** The source's own list (Chats D15, Headless runs D16), in the log's place; All sessions has none. */
  list: ToolkitActivityList.optional(),
  source: z.string().optional(),
})
export type ToolkitActivityCounts = z.infer<typeof ToolkitActivityCounts>

/**
 * The Activity view of the page (D11 `activity` 444:498): where its counts come from (the header's line), since when
 * (the list tools' end, or the tablet's back row), the title of the tablet's page, the source switch and the counts of
 * each source. A source with no counts is shown disabled until a frame draws it.
 */
export const ToolkitActivityView = z.object({
  title: z.string(),
  readFrom: z.string(),
  since: z.string(),
  sources: z.array(z.object({ value: ToolkitActivitySource, label: z.string() })).length(3),
  counts: z.partialRecord(ToolkitActivitySource, ToolkitActivityCounts),
})
export type ToolkitActivityView = z.infer<typeof ToolkitActivityView>

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
  /**
   * The items the open item's links name, each with its Files tab's browser (D19 482:660: a tap on a link's file and
   * line opens that file on its item's Files tab). An item the list does not show opens from here; an item with no
   * browser in `details` takes this one, and its Files tab. None when the state has no Links tab.
   */
  linkTargets: z.array(z.object({ item: ToolkitItemView, browser: ToolkitFileBrowser })).optional(),
  /**
   * The items an Evals or Activity tab's rows name that the list does not show (D25 `round · writer` 492:506: a rule's
   * ledgers are skills, and D25's list has no Skills group; D23 `row · readme · cross-family x1`: a workflow's rounds
   * name skills, and D23's list has none); a tap on one opens it from here. None when the state has none.
   */
  evalTargets: z.array(ToolkitItemView).optional(),
  /** What the Activity view counts (D11); without it the Activity view shows the list. */
  activity: ToolkitActivityView.optional(),
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
   * Whether the open workflow fills the page, without the list (D8's Open full page, D13). Only an item with a
   * `flowPage` opens so; another item opens beside the list. Not open when not set.
   */
  flowFullPage: z.boolean().optional(),
  /** The id of the step selected on a workflow's page (D13); its first step with fields when not set. */
  flowStep: z.string().optional(),
  /** The path of the file selected on the open item's Files tab (D6); the browser's `selected` when not set. */
  file: z.string().optional(),
  /**
   * How the Files tab's viewer shows a script that has an explanation (D10): Explain or Code; or a Markdown file (T4):
   * Rendered or its source (`code`). Explain or Rendered when not set; a script with no explanation shows its code.
   */
  fileView: z.enum(['explain', 'rendered', 'code']).optional(),
  /**
   * On a tablet or phone, whether the selected file fills the item's Files tab on a page of its own (T6): Back to
   * Files over its name, its path badge and the tabs, then the file. A script with an explanation opens so; another
   * file opens under the tree (T4). Under the tree when not set.
   */
  filePage: z.boolean().optional(),
  /**
   * The line of the file on the Files tab that a link names (D19, "SKILL.md:8"): the viewer shows the file's source
   * at that line and scrolls to it. None when the file opened from its tree row.
   */
  line: z.number().int().positive().optional(),
  /** Whether the open item's discussion shows (D5, T5, M7): beside the item on the desktop, in its place elsewhere. */
  discussOpen: z.boolean().optional(),
  /** What Erik has typed in the discussion's reply box; empty when not set. */
  discussDraft: z.string().optional(),
  /** The messages Erik sent in the discussion, after its entries. Nothing answers them in this mock-up. */
  discussSent: z.array(z.string()).optional(),
  /** The source the Activity view counts (D11's All sessions, Chats or Headless runs); All when not set. */
  activitySource: ToolkitActivitySource.optional(),
  /**
   * The id of the run open in the Activity view (D12): beside the view on the desktop, on a page of its own on a
   * tablet or phone. None when not set.
   */
  run: z.string().optional(),
  /**
   * The id of the chat open in the Activity view (D18): beside the view on the desktop, on a page of its own on a
   * tablet or phone (T14, M16). None when not set.
   */
  chat: z.string().optional(),
  /** Show all under the Activity view's list was pressed: every row of the list shows. */
  activityShowAll: z.boolean().optional(),
})
export type ToolkitUi = z.infer<typeof ToolkitUi>

/** The schema of one Toolkit state, for the state checks. */
export const ToolkitState = z.object({ data: ToolkitData, ui: ToolkitUi })
