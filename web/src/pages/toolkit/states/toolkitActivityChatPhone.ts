// Figma Toolkit M16 "M16 · A chat open": on the phone a chat opens on a page
// of its own under Activity › Chats, as on a tablet (T14): the icon, the
// title and the badge one under the other, a shorter line and no source
// column. A tap on the chat's row in M13 gives this state. Copy word for word
// from references/toolkit/M16/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesPhone } from './shared/activitySources.ts'
import { toolkitActivityPhone } from './toolkitActivityPhone.ts'

export const toolkitActivityChatPhone = {
  title: 'a chat open on the phone',
  frames: [{ id: 'M16', node: '475:911', viewport: 'phone' }],
  data: { ...toolkitActivityPhone.data, details: skillEvals.data.details, activity: activitySourcesPhone },
  ui: { ...toolkitActivityPhone.ui, activitySource: 'chats', chat: 'writer-rules-skills-agents' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
