// The Workspaces URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'

export const workspacesSearch = z.object({
  state: z.string().optional(),
})
