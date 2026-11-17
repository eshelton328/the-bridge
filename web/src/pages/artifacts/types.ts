// The Artifacts page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

/** The sample content a card's preview draws (the library's `Thumbnail` kinds). */
const ArtifactPreview = z.enum(['chart', 'diagram', 'doc', 'grid', 'ui'])
type ArtifactPreview = z.infer<typeof ArtifactPreview>

/** Where an artifact comes from: a Claude artifact or a Codex site. */
const ArtifactSource = z.enum(['claude', 'codex'])
type ArtifactSource = z.infer<typeof ArtifactSource>

/** One artifact card: its preview, title, description and meta line, as Figma writes them. */
export const ArtifactCard = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  preview: ArtifactPreview,
  source: ArtifactSource,
  /** The source as the meta line names it, such as "Claude" or "Codex site". */
  sourceLabel: z.string(),
  /** The project or repository, such as "ncc-1701". */
  project: z.string(),
  /** The age, such as "12m" or "1d". */
  age: z.string(),
  /** Found since Erik last looked: the card shows New. */
  isNew: z.boolean(),
})
export type ArtifactCard = z.infer<typeof ArtifactCard>

const ArtifactGroupId = z.enum(['found', 'earlier'])
type ArtifactGroupId = z.infer<typeof ArtifactGroupId>

/** A group of cards under its header, such as "Found since you last looked". */
export const ArtifactGroup = z.object({
  id: ArtifactGroupId,
  label: z.string(),
  /** How many artifacts the group holds; the library has more than the cards drawn. */
  count: z.number(),
  /** The New dot after the count. */
  dot: z.boolean(),
  cards: z.array(ArtifactCard),
})
export type ArtifactGroup = z.infer<typeof ArtifactGroup>

/** A source chip: All, a source or New, with the number of artifacts it holds. */
export const ArtifactChip = z.object({
  value: z.enum(['all', 'claude', 'codex', 'new']),
  label: z.string(),
  count: z.number(),
})
export type ArtifactChip = z.infer<typeof ArtifactChip>
export type ArtifactFilter = ArtifactChip['value']

/** A sort, such as `newest`; the state's `sorts` list the choices. */
const SortValue = z.string()
type SortValue = z.infer<typeof SortValue>

export const ViewValue = z.enum(['grid', 'list'])
export type ViewValue = z.infer<typeof ViewValue>

/** The chat that published an open artifact (D2 "Made in"): Open in workspace opens it. A proposal (D2 note). */
const ArtifactMadeIn = z.object({
  /** The section's label, such as "Made in". */
  label: z.string(),
  source: ArtifactSource,
  /** Such as "Published from chat quiet-nebula". */
  title: z.string(),
  /** The workspace, model and age as one line, such as "workspace skill-evals · Opus 5.5 · 12m ago". */
  meta: z.string(),
})

/** The artifact open beside the list (D2): its bar, title block, preview and the chat that made it. */
export const ArtifactDetail = z.object({
  /** The card it opens; its row is drawn selected. */
  id: z.string(),
  isNew: z.boolean(),
  /** Who found it and when, such as "found 12m ago by the Artifact hook". */
  found: z.string(),
  title: z.string(),
  description: z.string(),
  source: ArtifactSource,
  /** The source as its chip names it, such as "Claude artifact". */
  sourceLabel: z.string(),
  /** The project it is filed in; its chip opens the project menu. */
  project: z.string(),
  /** Such as "updated 12m ago". */
  updated: z.string(),
  preview: ArtifactPreview,
  /** The artifact's address without the scheme, as the preview's footer shows it. */
  link: z.string(),
  madeIn: ArtifactMadeIn,
})
export type ArtifactDetail = z.infer<typeof ArtifactDetail>

/** One box of the Filter menu (D3): a source, a project, a finder or an age, with how many artifacts it matches. */
const ArtifactFilterItem = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
  /** The label is a name in mono, such as a project (D3 403:6884); "Not in a project" is not. */
  mono: z.boolean(),
})

/**
 * The Filter menu under the list tools (D3): sections of checkboxes with counts, and a footer that names the
 * checked boxes and the Show button. Which boxes are checked is `ArtifactsUi.filterChecks`; they apply on Show.
 */
export const ArtifactFilterMenu = z.object({
  /** The label of the menu, for assistive technology. */
  label: z.string(),
  sections: z.array(z.object({ label: z.string(), items: z.array(ArtifactFilterItem) })),
  /** What the checked boxes show, such as "Claude artifacts in ncc-1701". */
  note: z.string(),
  /** The Show button, such as "Show 7". */
  show: z.string(),
})
export type ArtifactFilterMenu = z.infer<typeof ArtifactFilterMenu>

export const ArtifactsData = z.object({
  title: z.string(),
  /** The number of artifacts in the library, after the title. */
  count: z.number(),
  /** The needs-you count on the rail's Inbox item. */
  railBadge: z.number(),
  /** When the library last checked its sources, such as "Checked Claude and Codex 2m ago". */
  found: z.string(),
  addLink: z.string(),
  chips: z.array(ArtifactChip),
  searchPlaceholder: z.string(),
  /** The sorts, each with the short label the Sort button shows. */
  sorts: z.array(z.object({ value: SortValue, label: z.string() })),
  groups: z.array(ArtifactGroup),
  /** The artifact open beside the list (D2); without it the library shows its grid (D1). */
  open: ArtifactDetail.optional(),
  /** The Filter menu (D3); without it Filter opens nothing yet (D1, D2). */
  filterMenu: ArtifactFilterMenu.optional(),
})
export type ArtifactsData = z.infer<typeof ArtifactsData>

/** The view state a Figma frame shows. */
export const ArtifactsUi = z.object({
  filter: ArtifactChip.shape.value,
  sort: SortValue,
  view: ViewValue,
  /** Whether each group is open. */
  groupsOpen: z.record(ArtifactGroupId, z.boolean()),
  /** The text in the search field. */
  query: z.string(),
  /** The Filter menu is open (D3). */
  filterOpen: z.boolean().optional(),
  /** The Filter menu's checked boxes; they apply when Erik selects Show. */
  filterChecks: z.array(z.string()).optional(),
})
export type ArtifactsUi = z.infer<typeof ArtifactsUi>

/** The schema of one Artifacts state, for the state checks. */
export const ArtifactsState = z.object({ data: ArtifactsData, ui: ArtifactsUi })
