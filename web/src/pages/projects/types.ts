// The Projects page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

/** One card of the Projects home (R2): the project's tile, name and purpose, and whether the owner pinned it (R3). */
export const ProjectCard = z.object({
  /** The project's folder name under the brain's `projects/`, as the server names it. */
  slug: z.string().min(1),
  name: z.string().min(1),
  purpose: z.string(),
  /** A library icon's name the owner set; null draws the name's first letter (blocks/ProjectTile.tsx). */
  icon: z.string().nullable(),
  /** Pinned first, with the pin after the name (D10's NCC-1701). */
  pinned: z.boolean(),
})
export type ProjectCard = z.infer<typeof ProjectCard>

/** The words of a card's ⋯ menu (D10): Pin to top, its undo on a pinned card, and Edit details. */
export const ProjectMenuWords = z.object({
  /** The ⋯ button's accessible name; `{name}` is the project's name. */
  label: z.string(),
  pin: z.string(),
  unpin: z.string(),
  edit: z.string(),
})
export type ProjectMenuWords = z.infer<typeof ProjectMenuWords>

/** The words of a project's page (R4): its back row, Quick chat and the tabs of increment one (d-133). */
export const ProjectPageWords = z.object({
  back: z.string(),
  /** The back button's accessible name, such as "Back to Projects". */
  backLabel: z.string(),
  quickChat: z.string(),
  /** The tab list's accessible name. */
  tabs: z.string(),
  overview: z.string(),
  ideas: z.string(),
  /** Quick chat's words (R8). */
  message: z.string(),
  retry: z.string(),
  /** The Overview's panels (R5, R6): headings, group names and the PR pills by status. */
  panels: z.record(z.enum(['inbox', 'queue', 'needsYou', 'toReview', 'inProgress']), z.string()),
  pulls: z.record(z.enum(['draft', 'ciFailed', 'ciRunning', 'inReview']), z.string()),
  /** Each Inbox kind's word, the name of its row's kind tile for assistive tech. */
  kinds: z.record(z.enum(['approval', 'question', 'review', 'action']), z.string()),
})
export type ProjectPageWords = z.infer<typeof ProjectPageWords>

/** A project page's tab (R4): Overview and Ideas only, the tabs of increment one (d-133). */
export const ProjectTab = z.enum(['overview', 'ideas'])
export type ProjectTab = z.infer<typeof ProjectTab>

/** An Inbox panel row (R5): the item's kind tile, title, project and age ("5d"). */
const InboxRow = z.object({
  kind: z.enum(['approval', 'question', 'review', 'action']),
  title: z.string(),
  meta: z.string(),
  age: z.string(),
})
/** An open PR of the Queue panel (R6): its title, `<repository>#<number>` and its pill. */
const PullRow = z.object({
  title: z.string(),
  meta: z.string(),
  status: z.enum(['draft', 'ciFailed', 'ciRunning', 'inReview']),
})

/** A project's Overview panels (R5, R6); `unread` is the line of the repositories whose PRs were not read. */
export const ProjectOverview = z.object({
  inbox: z.object({ needsYou: z.array(InboxRow), toReview: z.array(InboxRow) }),
  queue: z.object({ inProgress: z.array(PullRow), unread: z.string().optional() }),
})
export type ProjectOverview = z.infer<typeof ProjectOverview>

export const ProjectsData = z.object({
  title: z.string(),
  /** New project: drawn as the frames do; it has no action until increment four (d-133). */
  newProject: z.string(),
  /** The Inbox needs-you count on the rail and the tab bar. */
  railBadge: z.number().int().nonnegative(),
  /** The cards' heading for a screen reader, between the page's h1 and each card's h3; no frame draws it. */
  cardsHeading: z.string(),
  menu: ProjectMenuWords,
  page: ProjectPageWords,
  /** The cards in the order they show: the pinned ones first. */
  projects: z.array(ProjectCard),
  /** Set when the cards came from the server (liveProjects.ts), so the entry sends a pin to it. */
  live: z.object({}).optional(),
  /** The open project's Overview panels; with none the Overview tab draws none (the home, the live page for now). */
  overview: ProjectOverview.optional(),
  /** The line of a read or a pin that missed, such as "Projects not read — the server answered 500". */
  notice: z.string().optional(),
})
export type ProjectsData = z.infer<typeof ProjectsData>

/** Quick chat's composer (R8): open while set, off while busy, and the line of a start kept back. */
export const QuickChatStatus = z.object({
  busy: z.boolean().optional(),
  line: z.string().optional(),
  retry: z.boolean().optional(),
})
export type QuickChatStatus = z.infer<typeof QuickChatStatus>

/** The view state a frame shows. */
export const ProjectsUi = z.object({
  /** The slug of the card whose ⋯ menu is open (D10: Pinpoint). */
  menuFor: z.string().optional(),
  /** The More drawer, which a tablet's or phone's More opens. */
  moreOpen: z.boolean().optional(),
  /** The slug of the project whose page shows (`/projects/<slug>`, R4); the home shows when not set. */
  open: z.string().optional(),
  /** The project page's selected tab; Overview when not set. */
  tab: ProjectTab.optional(),
  quickChat: QuickChatStatus.optional(),
  /** The Overview's groups the owner opened or closed; "Needs you" and "In progress" start open. */
  groupsOpen: z.partialRecord(z.enum(['needsYou', 'toReview', 'inProgress']), z.boolean()).optional(),
})
export type ProjectsUi = z.infer<typeof ProjectsUi>

/** The schema of one Projects state, for the state checks. */
export const ProjectsState = z.object({ data: ProjectsData, ui: ProjectsUi })
