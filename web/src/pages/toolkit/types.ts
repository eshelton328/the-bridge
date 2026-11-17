// The Toolkit page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

export const ToolkitData = z.object({
  title: z.string(),
})
export type ToolkitData = z.infer<typeof ToolkitData>

/** The view state a Figma frame shows. */
export const ToolkitUi = z.object({})
export type ToolkitUi = z.infer<typeof ToolkitUi>

/** The schema of one Toolkit state, for the state checks. */
export const ToolkitState = z.object({ data: ToolkitData, ui: ToolkitUi })
