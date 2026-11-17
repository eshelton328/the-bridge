// Figma Inbox T20 and M21 "Proposed new tasks": D17's proposal on the discussion's
// page. Copy word for word from references/inbox/T20/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { tasksProposed } from './tasksProposed.ts'

export const tasksProposedPage = {
  title: 'proposed new tasks, on the discussion page',
  frames: [
    { id: 'T20', node: '402:11710', viewport: 'tablet' },
    { id: 'M21', node: '402:7158', viewport: 'phone' },
  ],
  data: tasksProposed.data,
  ui: tasksProposed.ui,
} satisfies ScreenState<InboxData, InboxUi>
