// Figma Toolkit D24 "D24 · A hook’s activity": the hook commit-msg open
// beside the list, as in D9 (hookOpen), on its Activity tab: every commit it
// checked, and why it rejected 9 messages. Copy word for word from
// references/toolkit/D24/frame.json (shared/activity.ts); the list is D9's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

export const hookActivity = {
  title: 'a hook open beside the list, on Activity',
  frames: [{ id: 'D24', node: '491:5982', viewport: 'desktop' }],
  data: { ...hookOpen.data },
  ui: { ...hookOpen.ui, itemTab: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
