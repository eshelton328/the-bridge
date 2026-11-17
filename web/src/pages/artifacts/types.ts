// The Artifacts page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

export const ArtifactsData = z.object({
  title: z.string(),
})
export type ArtifactsData = z.infer<typeof ArtifactsData>

/** The view state a Figma frame shows. */
export const ArtifactsUi = z.object({})
export type ArtifactsUi = z.infer<typeof ArtifactsUi>

/** The schema of one Artifacts state, for the state checks. */
export const ArtifactsState = z.object({ data: ArtifactsData, ui: ArtifactsUi })
