// Figma Inbox T24 "Removed, in Done": D21's Done list on the tablet, the
// removed task with its reason in red. Copy word for word from
// references/inbox/T24/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { removed } from './removed.ts'

export const removedList = {
  title: 'removed, in Done, the list',
  frames: [{ id: 'T24', node: '402:12551', viewport: 'tablet' }],
  data: removed.data,
  ui: { ...removed.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
