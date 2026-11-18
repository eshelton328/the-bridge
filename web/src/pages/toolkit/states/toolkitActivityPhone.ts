// Figma Toolkit M10 "M10 · Activity": the Activity view on the phone, under
// the list's header with Activity picked: T9's counts with two runs and
// shorter lines; Most called runs under the tab bar. A tap on a run opens it
// on a page of its own, as the frame's note says. Chats and Headless have
// M13's and M14's counts (shared/activitySources.ts). Copy word for word
// from references/toolkit/M10/frame.json (shared/activityView.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { activitySourcesPhone } from './shared/activitySources.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityPhone = {
  title: 'the Activity view on the phone',
  frames: [{ id: 'M10', node: '449:369', viewport: 'phone' }],
  data: { ...toolkitActivity.data, activity: activitySourcesPhone },
  ui: { ...toolkitActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
