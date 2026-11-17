// Figma Inbox T22 "Proposed removal": D19's proposal on the discussion's
// page. Copy word for word from references/inbox/T22/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { removalProposed } from './removalProposed.ts'

export const removalProposedPage = {
  title: 'proposed removal, on the discussion page',
  frames: [{ id: 'T22', node: '402:12220', viewport: 'tablet' }],
  data: removalProposed.data,
  ui: removalProposed.ui,
} satisfies ScreenState<InboxData, InboxUi>
