// Figma Toolkit D12 "D12 · A run open": D11's Activity view with the run of
// writing-reviewer open beside it: its values, each with where it comes
// from, its steps so far and what its result will show. A tap on the run's
// row or its Open session in D11 gives this state, and close goes back to
// D11. Copy word for word from references/toolkit/D12/frame.json
// (shared/activityView.ts, with D12's keys of the headers and the button).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { activityRunOpen } from './shared/activityView.ts'
import { toolkitActivity } from './toolkitActivity.ts'

export const toolkitActivityRun = {
  title: 'the Activity view with a run open beside it',
  frames: [{ id: 'D12', node: '445:2', viewport: 'desktop' }],
  data: { ...toolkitActivity.data, activity: activityRunOpen },
  ui: { ...toolkitActivity.ui, run: 'writing-reviewer' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
