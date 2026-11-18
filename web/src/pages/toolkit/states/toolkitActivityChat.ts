// Figma Toolkit D18 "D18 · A chat open": D15's Chats with Writer rules,
// skills, and agents open beside the view: when the chat ran, its project,
// model, messages, tokens and hook blocks, the toolkit items it used (each
// opens its page) and the tools it used. A tap on the chat's row in D15
// gives this state, and close goes back to D15. Copy word for word from
// references/toolkit/D18/frame.json (shared/activitySources.ts, with D18's
// keys of the headers and the button).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activityChatOpen } from './shared/activitySources.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityChat = {
  title: 'the Activity view with a chat open beside it',
  frames: [{ id: 'D18', node: '478:40', viewport: 'desktop' }],
  data: { ...toolkitActivity.data, details: skillEvals.data.details, activity: activityChatOpen },
  ui: { ...toolkitActivity.ui, activitySource: 'chats', chat: 'writer-rules-skills-agents' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
