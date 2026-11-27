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

export const ProjectsData = z.object({
  title: z.string(),
  /** New project: drawn as the frames do; it has no action until increment four (d-133). */
  newProject: z.string(),
  /** The Inbox needs-you count on the rail and the tab bar. */
  railBadge: z.number().int().nonnegative(),
  /** The cards' heading for a screen reader, between the page's h1 and each card's h3; no frame draws it. */
  cardsHeading: z.string(),
  menu: ProjectMenuWords,
  /** The cards in the order they show: the pinned ones first. */
  projects: z.array(ProjectCard),
  /** Set when the cards came from the server (liveProjects.ts), so the entry sends a pin to it. */
  live: z.object({}).optional(),
  /** The line of a read or a pin that missed, such as "Projects not read — the server answered 500". */
  notice: z.string().optional(),
})
export type ProjectsData = z.infer<typeof ProjectsData>

/** The view state a frame shows. */
export const ProjectsUi = z.object({
  /** The slug of the card whose ⋯ menu is open (D10: Pinpoint). */
  menuFor: z.string().optional(),
  /** The More drawer, which a tablet's or phone's More opens. */
  moreOpen: z.boolean().optional(),
})
export type ProjectsUi = z.infer<typeof ProjectsUi>

/** The schema of one Projects state, for the state checks. */
export const ProjectsState = z.object({ data: ProjectsData, ui: ProjectsUi })
