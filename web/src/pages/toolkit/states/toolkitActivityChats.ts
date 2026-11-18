// Figma Toolkit D15 "D15 · Activity, chats": D11's Activity view with Chats
// picked: the key figures, the runs and the calls per day of the chats only,
// the chats that used the toolkit (each with the items it used; an item opens
// its page and the row opens the chat, D18) and Most called in chats. Copy
// word for word from references/toolkit/D15/frame.json
// (shared/activitySources.ts); running now is sample data.
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesDesktop } from './shared/activitySources.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityChats = {
  title: 'the Activity view, chats',
  frames: [{ id: 'D15', node: '477:2', viewport: 'desktop' }],
  data: { ...toolkitActivity.data, details: skillEvals.data.details, activity: activitySourcesDesktop },
  ui: { ...toolkitActivity.ui, activitySource: 'chats' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
