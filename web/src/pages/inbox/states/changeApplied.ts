// Figma Inbox D16 "The task after Apply": D15 after Apply. The task shows
// the new prompt with Undo, and the proposal turns to Applied. Nothing runs
// until Erik clicks Start. Copy word for word from
// references/inbox/D16/frame.json, in the proposal's `apply`.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { changeProposed } from './changeProposed.ts'

export const changeApplied = {
  title: 'the task after Apply',
  frames: [{ id: 'D16', node: '403:1489', viewport: 'desktop' }],
  data: changeProposed.data,
  ui: { ...changeProposed.ui, proposals: { update: 'applied' } },
} satisfies ScreenState<InboxData, InboxUi>
