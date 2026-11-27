// The Projects URL search params, validated. `state` picks a state in development.
import { z } from 'zod'
import { dataSourceParam } from '../../lib/dataSource.ts'
import { ProjectTab } from './types.ts'

export const projectsSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); the home reads live when not set. */
  source: dataSourceParam,
  /** A project page's tab (R4); Overview when not set or unknown. */
  tab: ProjectTab.optional().catch(undefined),
})
