// Figma Toolkit M14 "M14 · Activity, headless runs": M10's Activity view
// with Headless picked: the key figures two by two, one headless run, their
// calls per day and the evals, running under the tab bar. Copy word for word
// from references/toolkit/M14/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesPhone } from './shared/activitySources.ts'
import { toolkitActivityPhone } from './toolkitActivityPhone.ts'

export const toolkitActivityHeadlessPhone = {
  title: 'the Activity view on the phone, headless runs',
  frames: [{ id: 'M14', node: '477:2285', viewport: 'phone' }],
  data: { ...toolkitActivityPhone.data, details: skillEvals.data.details, activity: activitySourcesPhone },
  ui: { ...toolkitActivityPhone.ui, activitySource: 'headless' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
