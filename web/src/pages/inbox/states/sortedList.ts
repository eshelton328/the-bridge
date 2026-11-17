// Figma Inbox T11 "Sorted by project": D11's list on its own; the Sort
// button names the sort, and each group has a heading per project. Copy
// word for word from references/inbox/T11/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { sortedByProject } from './sortedByProject.ts'

export const sortedList = {
  title: 'sorted by project, the list',
  frames: [{ id: 'T11', node: '346:7731', viewport: 'tablet' }],
  data: sortedByProject.data,
  ui: { ...sortedByProject.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
