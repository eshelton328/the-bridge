// Figma Inbox T19 and M20 "The task after Apply": T18 after Apply, back on the
// task page: the new prompt and a line with Undo; nothing runs until the owner
// taps Start. My notes has T2's empty field. Copy word for word from
// references/inbox/T19/frame.json, in the proposal's `apply`.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { changeApplied } from './changeApplied.ts'
import { taskPage } from './taskPage.ts'

export const changeAppliedPage = {
  title: 'the task after Apply, on the task page',
  frames: [
    { id: 'T19', node: '402:11473', viewport: 'tablet' },
    { id: 'M20', node: '402:2250', viewport: 'phone' },
  ],
  data: {
    ...changeApplied.data,
    detail: { ...changeApplied.data.detail, notes: taskPage.data.detail.notes },
  },
  ui: { ...changeApplied.ui, discussOpen: false },
} satisfies ScreenState<InboxData, InboxUi>
