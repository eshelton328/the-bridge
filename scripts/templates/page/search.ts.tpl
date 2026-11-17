// The {{Title}} URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'

export const {{page}}Search = z.object({
  state: z.string().optional(),
})
