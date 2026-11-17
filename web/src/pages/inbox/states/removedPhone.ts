// Figma Inbox M25 "Removed, in Done": T24's Done list on the phone, the
// removed task with its reason in red. Its task page has Restore, which
// puts the task back in Next steps (as on D21). The note says none of this
// flow is decided. Figma counts 5 next steps here, after the three tasks
// M22 created, where T24 counts 2. Copy word for word from
// references/inbox/M25/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { removedList } from './removedList.ts'

export const removedPhone = {
  title: 'removed, in Done, on the phone',
  frames: [{ id: 'M25', node: '402:7855', viewport: 'phone' }],
  data: {
    ...removedList.data,
    // Before the removal, as in `removed`: the list shows one next step less.
    filters: removedList.data.filters.map((f) => (f.value === 'next' ? { ...f, count: 6 } : f)),
  },
  ui: removedList.ui,
} satisfies ScreenState<InboxData, InboxUi>
