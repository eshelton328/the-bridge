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
})
export type ArtifactsUi = z.infer<typeof ArtifactsUi>

/** The schema of one Artifacts state, for the state checks. */
export const ArtifactsState = z.object({ data: ArtifactsData, ui: ArtifactsUi })
