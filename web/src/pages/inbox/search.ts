// The Inbox URL search params, validated (rule 3: the URL is outside
// input). `state` picks a Figma state in development; `filter` is the
// selected filter chip.
import { z } from 'zod'

export const inboxSearch = z.object({
  state: z.string().optional(),
  filter: z.string().optional(),
})
