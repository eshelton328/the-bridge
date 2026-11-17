// Figma Inbox D20 "Confirm the removal": D19 after Remove…, with the
// confirm dialog over it. Linear is not changed. Copy word for word from
// references/inbox/D20/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { removalProposed } from './removalProposed.ts'

export const removeConfirm = {
  title: 'confirm the removal',
  frames: [{ id: 'D20', node: '403:3431', viewport: 'desktop' }],
  data: removalProposed.data,
  ui: { ...removalProposed.ui, removeOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
