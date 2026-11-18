// Figma Toolkit T11 "T11 · Activity, chats": T9's Activity page with Chats
// picked: the key figures with no caption, the two chat runs, the chats'
// calls per day, five chats that used the toolkit with Show all under them
// and Most called in chats, under the tab bar. Copy word for word from
// references/toolkit/T11/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesTablet } from './shared/activitySources.ts'
import { toolkitActivityTablet } from './toolkitActivityTablet.ts'

export const toolkitActivityChatsTablet = {
  title: 'the Activity view on a tablet, chats',
  frames: [{ id: 'T11', node: '477:1179', viewport: 'tablet' }],
  data: { ...toolkitActivityTablet.data, details: skillEvals.data.details, activity: activitySourcesTablet },
  ui: { ...toolkitActivityTablet.ui, activitySource: 'chats' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
