// The Toolkit URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'

export const toolkitSearch = z.object({
  state: z.string().optional(),
})
