// Figma Inbox T13 "Snooze or dismiss": T2's task page with the Snooze
// menu open below the button: the snooze times, Mark done and Dismiss with
// a reason. Copy word for word from references/inbox/T13/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { taskPage } from './taskPage.ts'

export const snoozePage = {
  title: 'snooze or dismiss, on the task page',
  frames: [{ id: 'T13', node: '346:8337', viewport: 'tablet' }],
  data: taskPage.data,
  ui: { ...taskPage.ui, snoozeOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
