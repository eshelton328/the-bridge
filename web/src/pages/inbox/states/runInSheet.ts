// Figma Inbox M4 "Choose where it runs": M2's task page with the Run in
// picker open as a sheet over it, Done at the end of its title row. Copy
// word for word from references/inbox/M04/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { taskPage } from './taskPage.ts'

export const runInSheet = {
  title: 'choose where it runs, in a sheet',
  frames: [{ id: 'M4', node: '346:9604', viewport: 'phone' }],
  data: taskPage.data,
  ui: { ...taskPage.ui, pickerOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
