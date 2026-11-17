// Figma Inbox M6 "Snooze or dismiss": M1's list with the actions sheet of
// the long-pressed "Pick the header logo" open: snooze times, Mark done and
// Dismiss with a reason. Copy word for word from
// references/inbox/M06/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { list } from './list.ts'

export const rowActions = {
  title: 'snooze or dismiss a row, in a sheet',
  frames: [{ id: 'M6', node: '346:9985', viewport: 'phone' }],
  data: list.data,
  ui: { ...list.ui, actionsFor: InboxItemId.parse('pick-the-header-logo') },
} satisfies ScreenState<InboxData, InboxUi>
