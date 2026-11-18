// Figma Toolkit M24 "M24 · An agent’s activity": the agent writing-reviewer
// open on the phone on its Activity tab, with T21's data
// (agentActivityTablet) under Back to Toolkit, with no breadcrumb, as on M20
// and M28. Copy word for word from references/toolkit/M24/frame.json; every
// string is T21's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentActivity } from './agentActivity.ts'
import { agentActivityTablet } from './agentActivityTablet.ts'

export const agentActivityPhone = {
  title: 'an agent’s activity on the phone, under the agent’s header',
  frames: [{ id: 'M24', node: '491:8532', viewport: 'phone' }],
  data: { ...agentActivityTablet.data },
  // M24: Back to Toolkit, with no breadcrumb.
  ui: { ...agentActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
