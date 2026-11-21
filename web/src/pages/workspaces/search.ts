// The Workspaces URL search params, validated. `state` picks a Figma state in development.
import { ChatId } from '@bridge/contract'
import { z } from 'zod'
import { dataSourceParam } from '../../lib/dataSource.ts'

export const workspacesSearch = z.object({
  state: z.string().optional(),
  /** The data source in development (lib/dataSource.ts); fixtures when not set. */
  source: dataSourceParam,
  /** A live chat to open, from a tap on a push notification (d-118, useChatLink.ts); a value of another shape is dropped. */
  chat: ChatId.optional().catch(undefined),
})
