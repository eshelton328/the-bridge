// The Settings URL search params, validated. `state` picks a state in development.
import { z } from 'zod'
import { dataSourceParam, stateParam } from '../../lib/dataSource.ts'

export const settingsSearch = z.object({
  state: stateParam,
  /** The data source in development (lib/dataSource.ts); the page has fixtures only. */
  source: dataSourceParam,
})
