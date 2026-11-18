// Figma Toolkit T29 "T29 · An agent’s links": the agent writing-reviewer
// open on the iPad mini on its Links tab, with D30's links (agentLinks). It
// was opened from the skill writer's links, as on T7 (agentOpenTablet), so
// the back row is the breadcrumb Toolkit › writer › writing-reviewer over
// the agent's header (the kind badge, the name and the path row). The graph
// is narrower and the two panels stand one under the other. Copy word for
// word from references/toolkit/T29/frame.json; every string is D30's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentLinks } from './agentLinks.ts'

export const agentLinksTablet = {
  title: 'an agent’s links on a tablet, opened from writer',
  frames: [{ id: 'T29', node: '493:3607', viewport: 'tablet' }],
  data: { ...agentLinks.data },
  ui: { ...agentLinks.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
