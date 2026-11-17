// Figma Inbox T14 and M7 "Filter": T1's list with the Filter menu open
// (below the button; on the phone a sheet) and skill-evals cleared. The boxes apply when the menu closes, so
// the list still shows the skill-evals next step. Copy word for word from
// references/inbox/T14/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { projectFilter } from './filtered.ts'
import { list } from './list.ts'

export const filterList = {
  title: 'filter, the list',
  frames: [
    { id: 'T14', node: '346:8614', viewport: 'tablet' },
    { id: 'M7', node: '346:10262', viewport: 'phone' },
  ],
  data: list.data,
  ui: { ...list.ui, filterOpen: true, filterChecks: projectFilter },
} satisfies ScreenState<InboxData, InboxUi>
