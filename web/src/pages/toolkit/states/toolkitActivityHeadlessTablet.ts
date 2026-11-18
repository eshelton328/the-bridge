// Figma Toolkit T12 "T12 · Activity, headless runs": T9's Activity page
// with Headless picked: the key figures with no caption, the two headless
// runs, their calls per day, all seven evals (the two folders with no skill
// last) and Most called in headless runs, under the tab bar. Copy word for
// word from references/toolkit/T12/frame.json (shared/activitySources.ts).
// writer's details are D20's (skillEvals), so a tap on writer's eval opens
// its Evals tab.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'
import { activitySourcesTablet } from './shared/activitySources.ts'
import { toolkitActivityTablet } from './toolkitActivityTablet.ts'

export const toolkitActivityHeadlessTablet = {
  title: 'the Activity view on a tablet, headless runs',
  frames: [{ id: 'T12', node: '477:1563', viewport: 'tablet' }],
  data: { ...toolkitActivityTablet.data, details: skillEvals.data.details, activity: activitySourcesTablet },
  ui: { ...toolkitActivityTablet.ui, activitySource: 'headless' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
