// Figma Toolkit D16 "D16 · Activity, headless runs": D11's Activity view
// with Headless runs picked: the key figures, the runs and the calls per day
// of claude -p and SDK sessions only, the sessions by the skill eval that
// started them (the bar is the share that loaded an item; the skill chip
// opens its page) and Most called in headless runs. Copy word for word from
// references/toolkit/D16/frame.json (shared/activitySources.ts); running now
// is sample data.
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesDesktop } from './shared/activitySources.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityHeadless = {
  title: 'the Activity view, headless runs',
  frames: [{ id: 'D16', node: '477:596', viewport: 'desktop' }],
  data: { ...toolkitActivity.data, details: skillEvals.data.details, activity: activitySourcesDesktop },
  ui: { ...toolkitActivity.ui, activitySource: 'headless' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
