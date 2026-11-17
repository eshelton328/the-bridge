// Figma Inbox D9 "Sort": D6 with the Sort menu open below the button.
// Copy word for word from references/inbox/D09/frame.json; the frame's
// metadata names the menu heading "menu header", and frame.png shows
// "SORT BY".
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const sortOpen = {
  title: 'sort',
  frames: [{ id: 'D9', node: '346:3566', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    sortMenu: {
      heading: 'Sort by',
      options: [
        { value: 'newest', label: 'Newest first', description: 'Most recent activity at the top' },
        { value: 'oldest', label: 'Oldest first', description: 'Waiting longest at the top' },
        { value: 'project', label: 'Project', description: 'Grouped by project, then newest' },
        { value: 'kind', label: 'Kind', description: 'Approvals first, next steps last' },
      ],
      selected: 'newest',
      note: 'Sorting applies inside each group.',
    },
  },
  ui: { ...runningTask.ui, sortOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
