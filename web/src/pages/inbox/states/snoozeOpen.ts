// Figma Inbox D12 "Snooze or dismiss": D1 with the Snooze menu open below
// the button: the snooze times, Mark done and Dismiss with a reason. Copy
// word for word from references/inbox/D12/frame.json. The menu is every
// next step's (nextStep.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const snoozeOpen = {
  title: 'snooze or dismiss',
  frames: [{ id: 'D12', node: '346:4878', viewport: 'desktop' }],
  data: nextStep.data,
  ui: { ...nextStep.ui, snoozeOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
