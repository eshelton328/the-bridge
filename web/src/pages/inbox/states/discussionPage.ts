// Figma Inbox T17 and M18 "Discussion, before the first message": D14's
// discussion as a page of its own, with the task card on top and no tab
// bar. Copy word for word from references/inbox/T17/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { discussOpen } from './discussOpen.ts'

export const discussionPage = {
  title: 'the discussion, on its own page',
  frames: [
    { id: 'T17', node: '402:11100', viewport: 'tablet' },
    { id: 'M18', node: '402:1949', viewport: 'phone' },
  ],
  data: discussOpen.data,
  ui: discussOpen.ui,
} satisfies ScreenState<InboxData, InboxUi>
