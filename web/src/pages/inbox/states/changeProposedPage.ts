// Figma Inbox T18 and M19 "A proposed update": D15's proposal on the discussion's
// page. Copy word for word from references/inbox/T18/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { changeProposed } from './changeProposed.ts'

export const changeProposedPage = {
  title: 'a proposed update, on the discussion page',
  frames: [
    { id: 'T18', node: '402:11283', viewport: 'tablet' },
    { id: 'M19', node: '402:2096', viewport: 'phone' },
  ],
  data: changeProposed.data,
  ui: changeProposed.ui,
} satisfies ScreenState<InboxData, InboxUi>
