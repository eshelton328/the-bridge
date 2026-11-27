// The Artifacts URL search params, validated. `state` picks a Figma state in development.
import { z } from 'zod'
import { dataSourceParam, stateParam } from '../../lib/dataSource.ts'

export const artifactsSearch = z.object({
  state: stateParam,
  /** The data source in development (lib/dataSource.ts); fixtures when not set. */
  source: dataSourceParam,
})
