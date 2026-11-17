// Figma Inbox T23 "Confirm the removal": T22 after Remove…, with the
// confirm dialog (a dialog, not a sheet) over the discussion's page.
// Linear is not changed. Copy word for word from
// references/inbox/T23/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { removeConfirm } from './removeConfirm.ts'

export const removeConfirmPage = {
  title: 'confirm the removal, on the discussion page',
  frames: [{ id: 'T23', node: '402:12404', viewport: 'tablet' }],
  data: removeConfirm.data,
  ui: removeConfirm.ui,
} satisfies ScreenState<InboxData, InboxUi>
