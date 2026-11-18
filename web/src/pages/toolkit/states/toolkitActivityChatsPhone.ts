// Figma Toolkit M13 "M13 · Activity, chats": M10's Activity view with Chats
// picked: the key figures two by two, one chat run, the chats' calls per day
// and the chats that used the toolkit, running under the tab bar. Copy word
// for word from references/toolkit/M13/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesPhone } from './shared/activitySources.ts'
import { toolkitActivityPhone } from './toolkitActivityPhone.ts'

export const toolkitActivityChatsPhone = {
  title: 'the Activity view on the phone, chats',
  frames: [{ id: 'M13', node: '477:1956', viewport: 'phone' }],
  data: { ...toolkitActivityPhone.data, details: skillEvals.data.details, activity: activitySourcesPhone },
  ui: { ...toolkitActivityPhone.ui, activitySource: 'chats' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
