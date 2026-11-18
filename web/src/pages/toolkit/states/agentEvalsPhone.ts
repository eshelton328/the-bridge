// Figma Toolkit M28 "M28 · An agent’s evals": the agent writing-reviewer open
// on the phone on its Evals tab, with T25's data (agentEvalsTablet, D26's
// evals). As on M20 the agent opens under Back to Toolkit, with no
// breadcrumb, and keeps its header (the kind badge with when it changed, the
// name and the path badge); the rounds panel runs under the tab bar. Copy
// word for word from references/toolkit/M28/frame.json; every string is
// T25's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentEvals } from './agentEvals.ts'
import { agentEvalsTablet } from './agentEvalsTablet.ts'

export const agentEvalsPhone = {
  title: 'an agent’s evals on the phone, under the agent’s header',
  frames: [{ id: 'M28', node: '492:4116', viewport: 'phone' }],
  data: { ...agentEvalsTablet.data },
  // M28: Back to Toolkit, with no breadcrumb.
  ui: { ...agentEvals.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
