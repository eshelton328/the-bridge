// The Projects page's view models, display-ready, each from its Zod schema.
import { ChatStatus } from '@bridge/contract'
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
  repositories: z.string(),
  /** Quick chat's words (R8). */
  message: z.string(),
  retry: z.string(),
  /** The Overview's panels (R5, R6): headings, group names and the PR pills by status. */
  panels: z.record(z.enum(['inbox', 'queue', 'needsYou', 'toReview', 'inProgress']), z.string()),
  pulls: z.record(z.enum(['draft', 'ciFailed', 'ciRunning', 'inReview']), z.string()),
  /** Each Inbox kind's word, the name of its row's kind tile for assistive tech. */
  kinds: z.record(z.enum(['approval', 'question', 'review', 'action']), z.string()),
  /** The Ideas tab and an idea's page (R10, R11): the back row to the list, the empty list, each kind and state. */
  ideaBack: z.string(),
  ideaBackLabel: z.string(),
  noIdeas: z.string(),
  ideaKinds: z.record(z.enum(['idea', 'proposal', 'audit']), z.string()),
  ideaStates: z.record(z.enum(['open', 'in-design', 'needs-you', 'decided', 'parked']), z.string()),
  /**
   * The Chats panel (R7): its heading, the line with no chat and each status's pill word, as Workspaces words it;
   * the search's name, the chip row's name and the line when no chat matches.
   */
  chats: z.object({
    title: z.string(),
    none: z.string(),
    statuses: z.record(ChatStatus, z.string()),
    search: z.string(),
    chips: z.string(),
    noMatch: z.string(),
  }),
  /**
   * The Repositories tab (increment two, R2, R8): the empty list, each visibility, and each count with `{n}` and the
   * line of a part not read.
   */
  noRepositories: z.string(),
  visibility: z.record(z.enum(['public', 'private', 'internal']), z.string()),
  counts: z.record(z.enum(['openPull', 'openPulls', 'worktree', 'worktrees']), z.string()),
  unread: z.record(z.enum(['about', 'pulls', 'worktrees']), z.string()),
})
export type ProjectPageWords = z.infer<typeof ProjectPageWords>

/** A project page's tab (R4): Overview and Ideas of increment one, and Repositories of increment two (d-133). */
export const ProjectTab = z.enum(['overview', 'repositories', 'ideas'])
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
/**
 * A chat of the Chats panel (R7): a herdr chat tagged with the project, its workspace's label, its status and its
 * other tags as `<key>/<value>` ("area/bridge").
 */
const ChatRow = z.object({
  id: z.string(),
  title: z.string(),
  workspace: z.string(),
  status: ChatStatus,
  tags: z.array(z.string()).optional(),
})

/** The Context drift panel (R9): when the check ran ("Checked 5m ago"), its findings or `empty`, and Run check. */
export const ProjectDrift = z.object({
  title: z.string(),
  checked: z.string().optional(),
  /** What the check reads, after `checked` on its line, such as "Folder layout and hooks." */
  scope: z.string().optional(),
  findings: z.array(z.string()),
  /** The line in place of findings, such as "No drift found" or "The check did not run". */
  empty: z.string().optional(),
  run: z.string(),
  running: z.string(),
  /** A check runs: Run check is off and says `running`. */
  busy: z.boolean().optional(),
  /** The line of a read or a run that missed, such as "Drift not read — the server answered 500". */
  notRead: z.string().optional(),
})
export type ProjectDrift = z.infer<typeof ProjectDrift>

/** A project's Overview panels (R5, R6, R9); `unread` is the line of the repositories whose PRs were not read. */
export const ProjectOverview = z.object({
  /** `notRead` is the line of an Inbox read that missed, such as "Inbox not read — the server answered 500". */
  inbox: z.object({ needsYou: z.array(InboxRow), toReview: z.array(InboxRow), notRead: z.string().optional() }),
  queue: z.object({ inProgress: z.array(PullRow), unread: z.string().optional() }),
  /** The Context drift panel (D01, T01, T01b, M01). */
  drift: ProjectDrift.optional(),
  /** The Chats panel (R7), from the live page only; `notRead` is the line of a read that missed. */
  chats: z.object({ rows: z.array(ChatRow), notRead: z.string().optional() }).optional(),
})
export type ProjectOverview = z.infer<typeof ProjectOverview>

/** One idea of the Ideas tab (R10): its record's ID, title, tags, kind, state and age ("2d"). */
export const IdeaRow = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tags: z.array(z.string()),
  kind: z.enum(['idea', 'proposal', 'audit']),
  state: z.enum(['open', 'in-design', 'needs-you', 'decided', 'parked']),
  age: z.string(),
})
export type IdeaRow = z.infer<typeof IdeaRow>

/** The Ideas tab's rows, newest first, or none and the line of a read that missed. */
export const ProjectIdeas = z.object({ rows: z.array(IdeaRow), notRead: z.string().optional() })
export type ProjectIdeas = z.infer<typeof ProjectIdeas>

/**
 * One repository of the Repositories tab (increment two, R2, R8), as the server gives it: each count or fact null when
 * not read or off GitHub, and `unread` naming the parts not read.
 */
export const RepositoryRow = z.object({
  id: z.string().min(1),
  role: z.string(),
  visibility: z.enum(['public', 'private', 'internal']).nullable(),
  release: z.string().nullable(),
  openPulls: z.number().int().nonnegative().nullable(),
  worktrees: z.number().int().nonnegative().nullable(),
  unread: z.array(z.enum(['about', 'pulls', 'worktrees'])),
})
export type RepositoryRow = z.infer<typeof RepositoryRow>

/** The Repositories tab's rows in `project.yaml` order, or none and the line of a read that missed. */
export const ProjectRepositories = z.object({ rows: z.array(RepositoryRow), notRead: z.string().optional() })
export type ProjectRepositories = z.infer<typeof ProjectRepositories>

/** An idea's page (R11): its row and its record's text as Markdown. */
export const IdeaPage = z.object({ row: IdeaRow, body: z.string() })
export type IdeaPage = z.infer<typeof IdeaPage>

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
  /** The open project's Ideas tab (R10), read when the tab shows; with none the tab draws nothing. */
  ideas: ProjectIdeas.optional(),
  /** The open project's Repositories tab (increment two), read when the tab shows; with none the tab draws nothing. */
  repositories: ProjectRepositories.optional(),
  /** The idea whose page shows in place of the tabs (R11). */
  idea: IdeaPage.optional(),
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
  /** The ID of the idea whose page shows (`?idea=`, R11). */
  idea: z.string().optional(),
  /** The Overview's groups the owner opened or closed; "Needs you" and "In progress" start open. */
  groupsOpen: z.partialRecord(z.enum(['needsYou', 'toReview', 'inProgress']), z.boolean()).optional(),
})
export type ProjectsUi = z.infer<typeof ProjectsUi>

/** The schema of one Projects state, for the state checks. */
export const ProjectsState = z.object({ data: ProjectsData, ui: ProjectsUi })
