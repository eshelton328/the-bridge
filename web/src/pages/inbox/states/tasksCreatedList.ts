// Figma Inbox T21 "The new tasks in the inbox": D18's list on the tablet,
// with the new tasks under Next steps and the toast. Copy word for word
// from references/inbox/T21/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { tasksCreated } from './tasksCreated.ts'

export const tasksCreatedList = {
  title: 'the new tasks in the inbox, the list',
  frames: [{ id: 'T21', node: '402:11910', viewport: 'tablet' }],
  data: tasksCreated.data,
  ui: { ...tasksCreated.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
