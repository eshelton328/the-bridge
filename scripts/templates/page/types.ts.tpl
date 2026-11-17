// The {{Title}} page's view models, display-ready, each from its Zod schema.
import { z } from 'zod'

export const {{Page}}Data = z.object({
  title: z.string(),
})
export type {{Page}}Data = z.infer<typeof {{Page}}Data>

/** The view state a Figma frame shows. */
export const {{Page}}Ui = z.object({})
export type {{Page}}Ui = z.infer<typeof {{Page}}Ui>

/** The schema of one {{Title}} state, for the state checks. */
export const {{Page}}State = z.object({ data: {{Page}}Data, ui: {{Page}}Ui })
