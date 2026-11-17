// Figma Inbox T1 "Inbox": the list on its own, full width, with the tab
// bar; no item is open. Copy word for word from
// references/inbox/T01/frame.json; the list is D1's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const list = {
  title: 'the list',
  frames: [{ id: 'T1', node: '346:5353', viewport: 'tablet' }],
  data: nextStep.data,
  ui: { ...nextStep.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
