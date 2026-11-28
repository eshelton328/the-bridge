// The Projects URL search params, validated. `state` picks a state in development.
import { z } from 'zod'
import { dataSourceParam, stateParam } from '../../lib/dataSource.ts'
import { ProjectTab } from './types.ts'

export const projectsSearch = z.object({
  state: stateParam,
  /** The data source in development (lib/dataSource.ts); the home reads live when not set. */
  source: dataSourceParam,
  /** A project page's tab (R4); Overview when not set or unknown. */
  tab: ProjectTab.optional().catch(undefined),
  /** The idea whose page shows on a project's page (R11). */
  idea: z.string().min(1).optional().catch(undefined),
  /** The Architecture tab's scope (R9): `@system` or a repository ID; the first scope when not set. */
  scope: z.string().min(1).optional().catch(undefined),
})
