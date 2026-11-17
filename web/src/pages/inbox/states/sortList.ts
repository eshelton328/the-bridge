// Figma Inbox T9 and M13 "Sort": D9's list on its own, with the Sort menu open
// below the button (on the phone a sheet). Copy word for word from references/inbox/T09/frame.json;
// the menu is every state's (nextStep.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { sortOpen } from './sortOpen.ts'

export const sortList = {
  title: 'sort, the list',
  frames: [
    { id: 'T9', node: '346:7197', viewport: 'tablet' },
    { id: 'M13', node: '346:11568', viewport: 'phone' },
  ],
  data: sortOpen.data,
  ui: { ...sortOpen.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
