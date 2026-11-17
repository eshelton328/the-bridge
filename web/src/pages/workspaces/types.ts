// The Workspaces page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

export const WorkspacesData = z.object({
  title: z.string(),
})
export type WorkspacesData = z.infer<typeof WorkspacesData>

/** The view state a Figma frame shows. */
export const WorkspacesUi = z.object({})
export type WorkspacesUi = z.infer<typeof WorkspacesUi>

/** The schema of one Workspaces state, for the state checks. */
export const WorkspacesState = z.object({ data: WorkspacesData, ui: WorkspacesUi })
