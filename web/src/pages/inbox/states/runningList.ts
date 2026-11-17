// Figma Inbox T6 and M11 "Inbox after starting a task": D5's list on its own, with
// the started task under Running at the bottom. Copy word for word from
// references/inbox/T06/frame.json. A tap on the Running row opens the task
// page (T4, M10), as the M10, T4 and D6 notes say, not D5's chat: the
// detail is T4's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { running } from './running.ts'
import { runningTaskPage } from './runningTaskPage.ts'

export const runningList = {
  title: 'the list after starting a task',
  frames: [
    { id: 'T6', node: '346:6435', viewport: 'tablet' },
    { id: 'M11', node: '346:11108', viewport: 'phone' },
  ],
  data: { ...running.data, detail: runningTaskPage.data.detail },
  ui: { ...running.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
