// Figma Inbox T6 and M11 "Inbox after starting a task": D5's list on its own, with
// the started task under Running at the bottom. Copy word for word from
// references/inbox/T06/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { running } from './running.ts'

export const runningList = {
  title: 'the list after starting a task',
  frames: [
    { id: 'T6', node: '346:6435', viewport: 'tablet' },
    { id: 'M11', node: '346:11108', viewport: 'phone' },
  ],
  data: running.data,
  ui: { ...running.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
