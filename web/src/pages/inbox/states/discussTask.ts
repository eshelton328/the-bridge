// Figma Inbox T16 and M17 "Discuss, on the task page": T2 with Discuss in the task
// bar beside Snooze and Dismiss; it opens the task's discussion (T17).
// Copy word for word from references/inbox/T16/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { discussOpen } from './discussOpen.ts'
import { taskPage } from './taskPage.ts'

export const discussTask = {
  title: 'Discuss, on the task page',
  frames: [
    { id: 'T16', node: '402:10869', viewport: 'tablet' },
    { id: 'M17', node: '402:1759', viewport: 'phone' },
  ],
  data: { ...taskPage.data, discussion: discussOpen.data.discussion },
  ui: taskPage.ui,
} satisfies ScreenState<InboxData, InboxUi>
