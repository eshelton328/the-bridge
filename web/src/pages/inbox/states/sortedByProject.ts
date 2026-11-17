// Figma Inbox D11 "Sorted by project": the Sort button names the sort and
// shows it pressed; each group has a heading per project. The selected
// task stays selected. Copy word for word from
// references/inbox/D11/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const sortedByProject = {
  title: 'sorted by project',
  frames: [{ id: 'D11', node: '346:4416', viewport: 'desktop' }],
  data: runningTask.data,
  ui: { ...runningTask.ui, sort: 'project' },
} satisfies ScreenState<InboxData, InboxUi>
