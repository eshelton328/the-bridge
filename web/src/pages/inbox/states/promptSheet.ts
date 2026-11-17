// Figma Inbox T8 and M9 "Read the whole prompt": T2 with the suggested prompt open
// read-only in a sheet. Copy word for word from
// references/inbox/T08/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { taskPage } from './taskPage.ts'

export const promptSheet = {
  title: 'read the whole prompt in a sheet',
  frames: [
    { id: 'T8', node: '346:6944', viewport: 'tablet' },
    { id: 'M9', node: '346:10643', viewport: 'phone' },
  ],
  data: taskPage.data,
  ui: { ...taskPage.ui, promptOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
