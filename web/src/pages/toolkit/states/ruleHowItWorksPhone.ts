// Figma Toolkit M39 "M39 · How a rule works": the rule skills open on the
// phone, on its How it works tab, with T36's data (ruleHowItWorksTablet, D37's
// data with no line on what Codex does instead): under the back row to Toolkit
// the item keeps the header of its Overview (M19, ruleOpenPhone): the kind
// badge with when it changed, the name and the path row; then when the rule
// loads and the four steps in one column. Copy word for word from
// references/toolkit/M39/frame.json; it has T36's text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleHowItWorksTablet } from './ruleHowItWorksTablet.ts'

export const ruleHowItWorksPhone = {
  title: 'a rule open on the phone, on How it works',
  frames: [{ id: 'M39', node: '495:2900', viewport: 'phone' }],
  data: { ...ruleHowItWorksTablet.data },
  ui: { ...ruleHowItWorksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
