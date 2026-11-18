// Figma Toolkit D22 "D22 · An agent’s activity": the agent writing-reviewer
// open beside the list, as in D7 (agentOpen), on its Activity tab: every
// run, from chats and from headless eval runs. Copy word for word from
// references/toolkit/D22/frame.json (shared/activity.ts); the list is D7's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

export const agentActivity = {
  title: 'an agent open beside the list, on Activity',
  frames: [{ id: 'D22', node: '491:4786', viewport: 'desktop' }],
  data: { ...agentOpen.data },
  ui: { ...agentOpen.ui, itemTab: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
