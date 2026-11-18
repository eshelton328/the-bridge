// Figma Toolkit T9 "T9 · Activity": the Activity view on a tablet, a page of
// its own under Back to Toolkit: the key figures with no caption, the runs
// in progress as rows, calls per day and the five most called items, with
// no log. A tap on a run opens it on a page of its own. Copy word for word
// from references/toolkit/T09/frame.json (shared/activityView.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { activityTablet } from './shared/activityView.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityTablet = {
  title: 'the Activity view on a tablet',
  frames: [{ id: 'T9', node: '449:2', viewport: 'tablet' }],
  data: { ...toolkitActivity.data, activity: activityTablet },
  ui: { ...toolkitActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
