// The Artifacts URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'
import { dataSourceParam } from '../../lib/dataSource.ts'

export const artifactsSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); fixtures when not set. */
  source: dataSourceParam,
})
