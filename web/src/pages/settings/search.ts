// The Settings URL search params, validated. `state` picks a state in development.
import { z } from 'zod'
import { dataSourceParam } from '../../lib/dataSource.ts'

export const settingsSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); the page has fixtures only. */
  source: dataSourceParam,
})
