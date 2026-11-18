// The Toolkit URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'

export const toolkitSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); fixtures when not set. */
  source: z.string().optional(),
})
