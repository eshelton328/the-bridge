// Figma Toolkit T21 "T21 · An agent’s activity": the agent writing-reviewer
// open on the iPad mini on its Activity tab, with D22's data
// (agentActivity), opened from writer as on T7 and T25: the back row is the
// breadcrumb Toolkit › writer › writing-reviewer. Copy word for word from
// references/toolkit/T21/frame.json; every string is D22's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentActivity } from './agentActivity.ts'

export const agentActivityTablet = {
  title: 'an agent’s activity on a tablet, opened from writer',
  frames: [{ id: 'T21', node: '491:6959', viewport: 'tablet' }],
  data: { ...agentActivity.data },
  ui: { ...agentActivity.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
