// Figma Toolkit T25 "T25 · An agent’s evals": the agent writing-reviewer open
// on the iPad mini on its Evals tab, with D26's data (agentEvals). It was
// opened from writer's D5 Reviewer badge (T16), so the back row is the
// breadcrumb Toolkit › writer › writing-reviewer over the agent's header (the
// kind badge, the name and the path row), as on T7. Copy word for word from
// references/toolkit/T25/frame.json; every string is D26's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentEvals } from './agentEvals.ts'

export const agentEvalsTablet = {
  title: 'an agent’s evals on a tablet, opened from writer',
  frames: [{ id: 'T25', node: '492:2619', viewport: 'tablet' }],
  data: { ...agentEvals.data },
  ui: { ...agentEvals.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
