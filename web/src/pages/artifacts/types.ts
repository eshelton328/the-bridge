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
  /** The artifact's address without the scheme; search reads it, and a match in it shows in the list (D4). */
  link: z.string().optional(),
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
  /**
   * Open in workspace as a link under the meta line, as the phone writes it, such as "Open in workspace ›" (M2); without
   * it the section ends with the Open in workspace button (D2, T2).
   */
  action: z.string().optional(),
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
  /**
   * The artifact's address without the scheme, as the preview's footer shows it; a card opened from the library
   * (`ArtifactsUi.openId`) has one only when its card has.
   */
  link: z.string().optional(),
  /** The chat that published it; a card opened from the library has none, and shows no Made in section. */
  madeIn: ArtifactMadeIn.optional(),
  /**
   * How the artifact shows after Erik applies its discussion's proposal (D9): Apply republishes it to the same link,
   * so the link and the library entry stay; the bar's pill and line and the updated chip change.
   */
  applied: z
    .object({
      /** The bar's pill, such as "Updated". */
      badge: z.string(),
      /** The bar's line, such as "updated just now from the discussion". */
      found: z.string(),
      /** The updated chip, such as "updated just now". */
      updated: z.string(),
    })
    .optional(),
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
 * The Filter menu under the list tools (D3), or the sheet over the tab bar on a tablet or phone (T3, M3): sections of
 * checkboxes with counts, and a footer that names the checked boxes and the Show button. Which boxes are checked is `ArtifactsUi.filterChecks`; they apply on Show.
 */
export const ArtifactFilterMenu = z.object({
  /** The label of the menu, for assistive technology. */
  label: z.string(),
  sections: z.array(z.object({ label: z.string(), items: z.array(ArtifactFilterItem) })),
  /** What the checked boxes show, such as "Claude artifacts in ncc-1701". */
  note: z.string(),
  /** The Show button, such as "Show 7". */
  show: z.string(),
  /** The tablet sheet's Clear (T3), which clears the boxes; the desktop menu has none (D3). */
  clear: z.string().optional(),
  /**
   * The Figma node id of the sheet's unnamed footer frame around Show, which each frame has its own: T3's 407:1719
   * when left out, M3's 407:501.
   */
  footLayer: z.string().optional(),
})
export type ArtifactFilterMenu = z.infer<typeof ArtifactFilterMenu>

/**
 * The Sort menu under the list tools (D6): a heading, one choice per sort with a line that says what it does, and a
 * note under a rule. The short label each sort shows on the button is in `ArtifactsData.sorts`; the picked sort is
 * `ArtifactsUi.sort`. Found since you last looked stays the first group in every sort.
 */
const ArtifactSortMenu = z.object({
  /** Such as "Sort by"; the menu shows it in capitals and names its list with it. */
  heading: z.string(),
  options: z.array(z.object({ value: SortValue, label: z.string(), description: z.string() })),
  /** Such as "Found since you last looked stays at the top." */
  note: z.string(),
})
export type ArtifactSortMenu = z.infer<typeof ArtifactSortMenu>

/** Where a search matched an artifact, in the order search reads them (D4). */
const MatchPlace = z.enum(['title', 'description', 'link', 'project'])
export type MatchPlace = z.infer<typeof MatchPlace>

/** What the list view shows for a search (D4): the label of each match place and the hint under the results. */
const ArtifactSearch = z.object({
  /** Such as "in title" for each place. */
  places: z.record(MatchPlace, z.string()),
  /** What search reads, under the results. */
  hint: z.string(),
  /**
   * The phone's match line for a match in a description, by the card's id, such as "…the cold-reader eval of the
   * readme skill…" (M5): the words around the match, as Figma writes them. A link match shows the link.
   */
  excerpts: z.record(z.string(), z.string()).optional(),
  /** The search field's Figma node id, where another layer of the frame is named "search" too (M5's keyboard key). */
  fieldLayer: z.string().optional(),
})
export type ArtifactSearch = z.infer<typeof ArtifactSearch>

/**
 * File in a project (M7): the phone's ⋯ button opens it as a sheet over the artifact's page. The artifact's title under
 * the sheet's title, a choice per project with how many artifacts it holds (the artifact's own project checked), and
 * Remove from the library with its note: Remove takes only the link out of the library, and the artifact stays where
 * it was published.
 */
const ArtifactFileMenu = z.object({
  /** Such as "File in a project". */
  title: z.string(),
  /** The title row's Done, which closes the sheet. */
  done: z.string(),
  /** The first choice, such as "Not in a project", with how many artifacts are in no project, such as "1". */
  none: z.object({ label: z.string(), count: z.string() }),
  /** One choice per project, such as ncc-1701, with how many artifacts it holds, such as "9 artifacts". */
  projects: z.array(z.object({ value: z.string(), count: z.string() })),
  /** Such as "Remove from the library". */
  remove: z.string(),
  /** What Remove does, under it. */
  note: z.string(),
})
export type ArtifactFileMenu = z.infer<typeof ArtifactFileMenu>

/** A field of the Add a link dialog (D5): its label, its value and the line under it. */
const AddLinkField = z.object({
  label: z.string(),
  value: z.string(),
  /** The line under the field; the phone's sheet (M6) leaves it out under the project. */
  hint: z.string().optional(),
})

/**
 * The Add a link dialog (D5), for an artifact the library did not find, such as a Codex site on its own domain: the
 * link, the source it was read as, the title from the page's `<title>` and the project. Which source is picked and
 * whether the dialog is open are `ArtifactsUi.addLinkSource` and `ArtifactsUi.addLinkOpen`.
 */
export const AddLinkForm = z.object({
  title: z.string(),
  description: z.string(),
  link: AddLinkField,
  source: z.object({
    label: z.string(),
    /** One choice per source, labelled as the dialog names it, such as "Codex site". */
    options: z.array(z.object({ value: ArtifactSource, label: z.string() })),
    /** The line under the choice; the phone's sheet (M6) leaves it out. */
    hint: z.string().optional(),
  }),
  name: AddLinkField,
  /** The project, picked from a menu of `projects`; it may be left out. */
  project: AddLinkField.extend({ projects: z.array(z.string()) }),
  cancel: z.string(),
  submit: z.string(),
})
export type AddLinkForm = z.infer<typeof AddLinkForm>

/** One line of a proposed change: taken out or put in. */
const ArtifactDiffLine = z.object({ change: z.enum(['removed', 'added']), text: z.string() })

/**
 * A change to the artifact the discussion proposes (D8), as the Inbox's proposed update (Inbox D15): the block's
 * eyebrow, such as "Proposed · Update this artifact", the part it changes, such as "Chart", and the lines it takes out
 * and puts in. Nothing changes until Apply.
 */
const ArtifactProposal = z.object({
  label: z.string(),
  section: z.string(),
  lines: z.array(ArtifactDiffLine),
  /**
   * The block after Apply (D9), as the Inbox's applied update (Inbox D16): its eyebrow, such as "Applied · Updated
   * this artifact", the line under the lines it put in, and how much of the context window the discussion uses then.
   */
  apply: z.object({ label: z.string(), note: z.string(), context: z.number().min(0).max(100) }).optional(),
})
export type ArtifactProposal = z.infer<typeof ArtifactProposal>

/** One entry of the artifact's discussion: Erik's message, the discussion's reply or a proposed change (D8). */
const ArtifactDiscussionEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({ type: z.literal('reply'), name: z.string(), text: z.string() }),
  z.object({ type: z.literal('proposal'), proposal: ArtifactProposal }),
])
export type ArtifactDiscussionEntry = z.infer<typeof ArtifactDiscussionEntry>

/** What Erik did to the discussion's proposal: applied it or discarded it (D8). */
const ProposalDecision = z.enum(['applied', 'discarded'])

/**
 * The discussion of the open artifact (D7), beside it: the header with Open in workspace, the model and how much
 * context it uses, what it may do, and before the first message the empty state and its suggested questions. A
 * proposal (D7 note): it continues the chat that made the artifact.
 */
const ArtifactDiscussion = z.object({
  title: z.string(),
  /** Such as "Open in workspace": opens the chat in its workspace with the full history. */
  openInWorkspace: z.string(),
  model: z.string(),
  /** The share of the context window in use, 0 to 100. */
  context: z.number().min(0).max(100),
  contextLabel: z.string(),
  guard: z.string(),
  empty: z.object({
    title: z.string(),
    text: z.string(),
    canLabel: z.string(),
    can: z.array(z.object({ icon: z.enum(['edit', 'plus', 'trash']), text: z.string() })),
    suggestions: z.array(z.string()),
    /** The label over the suggestions where they stack one under the other, such as "Try" (the phone's page, M9). */
    tryLabel: z.string().optional(),
  }),
  placeholder: z.string(),
  /** What was said and proposed so far (D8); with none the discussion shows `empty`. */
  entries: z.array(ArtifactDiscussionEntry),
  /**
   * The label of Back on the tablet's and the phone's discussion page (T4, M9), such as "Artifact": it returns to
   * the artifact.
   */
  back: z.string().optional(),
  /**
   * The source in the artifact's card on the discussion page, where the open artifact's own is shorter: the phone's
   * chip says "Claude" (M2) and its discussion's card "Claude artifact" (M9). The open artifact's without it.
   */
  sourceLabel: z.string().optional(),
  /**
   * The Figma node ids of the two layers named "button · Open in workspace" in the frame that shows the discussion:
   * the header's and the one in "Made in" (D7 452:2464 and 452:2406). Each frame has its own. The tablet's and the
   * phone's discussion pages (T4 452:3837, M9 452:4076) have no "Made in", so `madeIn` is left out there.
   */
  layers: z.object({ header: z.string(), madeIn: z.string().optional() }),
})
export type ArtifactDiscussion = z.infer<typeof ArtifactDiscussion>

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
  /** The Sort menu (D6); without it Sort opens nothing yet (D1 to D5). */
  sortMenu: ArtifactSortMenu.optional(),
  /** The search's match places and hint (D4); without it a search in the list view shows no places or hint. */
  search: ArtifactSearch.optional(),
  /** The Add a link dialog (D5); without it Add a link opens nothing yet (D1 to D4). */
  addLinkForm: AddLinkForm.optional(),
  /**
   * The phone's sheet's words for the form (M6: the one-line description, no line under Source or Project, Add), where
   * a state draws more than one width (the home); without it the sheet shows `addLinkForm`, as M6 does.
   */
  addLinkSheet: AddLinkForm.optional(),
  /** The open artifact's discussion (D7), which Discuss opens; without it Discuss opens nothing. */
  discussion: ArtifactDiscussion.optional(),
  /** File in a project (M7), which the phone's ⋯ button opens; without it the button opens nothing. */
  fileMenu: ArtifactFileMenu.optional(),
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
  /** Whether the list view's group of search matches is open (D4); open when not set. */
  matchesOpen: z.boolean().optional(),
  /** The Sort menu is open (D6). */
  sortOpen: z.boolean().optional(),
  /** The Add a link dialog is open (D5). */
  addLinkOpen: z.boolean().optional(),
  /** The source the Add a link dialog has picked, read from the link (D5). */
  addLinkSource: ArtifactSource.optional(),
  /**
   * The card Erik opened from the library (a card on D1 or T1, a row on M1 or D2's list): it opens as `data.open` does
   * (D2, T2, M2). `data.open`'s artifact when not set.
   */
  openId: z.string().optional(),
  /** Back closed the open artifact on a tablet (T2) or a phone (M2), and the library shows (T1, M1). */
  artifactClosed: z.boolean().optional(),
  /** The phone's ⋯ button opened File in a project (M7). */
  fileOpen: z.boolean().optional(),
  /** The project picked in File in a project, or `none` (M7); the open artifact's own project when not set. */
  fileProject: z.string().optional(),
  /** The phone's More opened the More drawer over the tab bar (M8). */
  moreOpen: z.boolean().optional(),
  /**
   * The open artifact's discussion is open: beside it on the desktop, and the library list closes (D7); on a tablet as
   * its own page in the artifact's place, with no tab bar (T4); on a phone the same (M9).
   */
  discussOpen: z.boolean().optional(),
  /** What Erik has typed in the discussion's reply box; a suggestion puts its question there. */
  discussDraft: z.string().optional(),
  /** The messages Erik sent in the discussion, in order; nothing answers them in this mock-up. */
  discussSent: z.array(z.string()).optional(),
  /**
   * What Erik did to the discussion's proposal (D8): Discard drops it; Apply shows the artifact Updated and the
   * proposal in its applied form (D9).
   */
  discussProposal: ProposalDecision.optional(),
})
export type ArtifactsUi = z.infer<typeof ArtifactsUi>

/** The schema of one Artifacts state, for the state checks. */
export const ArtifactsState = z.object({ data: ArtifactsData, ui: ArtifactsUi })
