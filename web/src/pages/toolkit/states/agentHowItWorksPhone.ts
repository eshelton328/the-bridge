// Figma Toolkit M40 "M40 · How an agent works": the agent writing-reviewer open
// on the phone, on its How it works tab, with T37's data (agentHowItWorksTablet,
// D38's data with no line on the only inputs it gets): under the back row to
// Toolkit the item keeps the header of its Overview (M20, agentOpenPhone): the
// kind badge with when it changed, the name and the path row; then when the
// agent starts and the four steps in its prompt in one column. As on M20, the
// agent is not opened from the writer skill's links, so the back row shows no
// breadcrumb (no `ui.from`). Copy word for word from
// references/toolkit/M40/frame.json; it has T37's text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentHowItWorks } from './agentHowItWorks.ts'
import { agentHowItWorksTablet } from './agentHowItWorksTablet.ts'

export const agentHowItWorksPhone = {
  title: 'an agent open on the phone, on How it works',
  frames: [{ id: 'M40', node: '495:3209', viewport: 'phone' }],
  data: { ...agentHowItWorksTablet.data },
  ui: { ...agentHowItWorks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
