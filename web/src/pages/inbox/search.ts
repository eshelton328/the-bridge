// The Inbox URL search params, validated (rule 3: the URL is outside
// input). `state` picks a Figma state in development; `filter` is the
// selected filter chip.
import { z } from 'zod'
import { dataSourceParam } from '../../lib/dataSource.ts'

export const inboxSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); the home reads live when not set. */
  source: dataSourceParam,
  filter: z.string().optional(),
})
