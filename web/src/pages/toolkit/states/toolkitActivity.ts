// Figma Toolkit D11 "D11 · Activity": the Activity view, the third view of
// the List, Map and Activity switch, with All sessions picked: the key
// figures, the runs in progress, the calls per day, the most called items
// and the log, from the session files on this Mac. The header, the count and
// the kind chips are D1's (toolkitList), so a tap on a Most called item opens
// it from D1's list. Copy word for word from references/toolkit/D11/frame.json
// (shared/activityView.ts); the runs and the log are sample data.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { activityDesktop } from './shared/activityView.ts'
import { toolkitList } from './toolkitList.ts'

export const toolkitActivity = {
  title: 'the Activity view, all sessions',
  frames: [{ id: 'D11', node: '444:2', viewport: 'desktop' }],
  data: { ...toolkitList.data, activity: activityDesktop },
  ui: { ...toolkitList.ui, view: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
