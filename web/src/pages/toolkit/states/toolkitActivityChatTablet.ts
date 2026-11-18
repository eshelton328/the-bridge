// Figma Toolkit T14 "T14 · A chat open": on a tablet a chat opens on a page
// of its own under Activity › Chats, with D18's values, each with where it
// comes from, the items it used and the tools it used. A tap on the chat's
// row in T11 gives this state, and Activity goes back to T11. Copy word for
// word from references/toolkit/T14/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesTablet } from './shared/activitySources.ts'
import { toolkitActivityTablet } from './toolkitActivityTablet.ts'

export const toolkitActivityChatTablet = {
  title: 'a chat open on a tablet',
  frames: [{ id: 'T14', node: '475:505', viewport: 'tablet' }],
  data: { ...toolkitActivityTablet.data, details: skillEvals.data.details, activity: activitySourcesTablet },
  ui: { ...toolkitActivityTablet.ui, activitySource: 'chats', chat: 'writer-rules-skills-agents' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
