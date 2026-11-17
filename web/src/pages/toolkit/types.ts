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
})
export type ToolkitUi = z.infer<typeof ToolkitUi>

/** The schema of one Toolkit state, for the state checks. */
export const ToolkitState = z.object({ data: ToolkitData, ui: ToolkitUi })
