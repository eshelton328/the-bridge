// Figma Inbox T7 "Done": D7's list on its own: finished tasks by day, each
// with how it ended. Copy word for word from
// references/inbox/T07/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { done } from './done.ts'

export const doneList = {
  title: 'Done, the list',
  frames: [{ id: 'T7', node: '346:6711', viewport: 'tablet' }],
  data: done.data,
  ui: { ...done.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
