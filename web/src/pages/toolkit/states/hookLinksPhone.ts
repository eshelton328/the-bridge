// Figma Toolkit M34 "M34 · A hook’s links": the hook commit-msg open on the
// phone on its Links tab, with T31's data (hookLinksTablet, D32's links): the
// hook and the rule it enforces name each other, so the rule stands on both
// sides. The hook keeps its header (Back to Toolkit, the kind badge with when
// it changed, the name and the path badge) over the tabs, as on M22. The graph
// stands upright and the two panels stand one under the other. Copy word for
// word from references/toolkit/M34/frame.json; every string is T31's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookLinksTablet } from './hookLinksTablet.ts'

export const hookLinksPhone = {
  title: 'a hook’s links on the phone, under the hook’s header',
  frames: [{ id: 'M34', node: '493:6712', viewport: 'phone' }],
  data: { ...hookLinksTablet.data },
  ui: { ...hookLinksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
