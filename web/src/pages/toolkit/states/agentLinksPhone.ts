// Figma Toolkit M32 "M32 · An agent’s links": the agent writing-reviewer open
// on the phone on its Links tab, with T29's data (agentLinksTablet, D30's
// links): four items name it, the skill and the agent writer among them, and
// it names three. As on M20 the agent opens under Back to Toolkit, with no
// breadcrumb, and keeps its header (the kind badge with when it changed, the
// name and the path badge) over the tabs. The graph stands upright and the
// two panels stand one under the other. Copy word for word from
// references/toolkit/M32/frame.json; every string is T29's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentLinks } from './agentLinks.ts'
import { agentLinksTablet } from './agentLinksTablet.ts'

export const agentLinksPhone = {
  title: 'an agent’s links on the phone, under the agent’s header',
  frames: [{ id: 'M32', node: '493:5704', viewport: 'phone' }],
  data: { ...agentLinksTablet.data },
  // M32 493:5731: Back to Toolkit, with no breadcrumb.
  ui: { ...agentLinks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
