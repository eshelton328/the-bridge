// Figma Toolkit M41 "M41 · How a hook works": the hook commit-msg open on the
// phone, on its How it works tab, with T38's data (hookHowItWorksTablet, D39's
// data with no tests line and step 3's use shown as a file): under the back row
// to Toolkit the item keeps the header of its Overview (M22, hookOpenPhone): the
// kind badge with when it changed, the name and the path row; then when the hook
// runs and the five checks it makes on each commit in one column. Copy word for
// word from references/toolkit/M41/frame.json; it has T38's text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookHowItWorksTablet } from './hookHowItWorksTablet.ts'

export const hookHowItWorksPhone = {
  title: 'a hook open on the phone, on How it works',
  frames: [{ id: 'M41', node: '495:3545', viewport: 'phone' }],
  data: { ...hookHowItWorksTablet.data },
  ui: { ...hookHowItWorksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
