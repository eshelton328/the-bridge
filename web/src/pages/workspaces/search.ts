// The Workspaces URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'

export const workspacesSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); fixtures when not set. */
  source: z.string().optional(),
})
