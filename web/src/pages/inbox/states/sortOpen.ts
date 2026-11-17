// Figma Inbox D9 "Sort": D6 with the Sort menu open below the button.
// Copy word for word from references/inbox/D09/frame.json; the frame's
// metadata names the menu heading "menu header", and frame.png shows
// "SORT BY". The menu is every state's (nextStep.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const sortOpen = {
  title: 'sort',
  frames: [{ id: 'D9', node: '346:3566', viewport: 'desktop' }],
  data: runningTask.data,
  ui: { ...runningTask.ui, sortOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
