// Figma Toolkit T18 "T18 · A workflow": the workflow skill-eval-round open on
// the iPad mini, on its Overview tab, with D8's content (workflowOpen): its
// kind, name, path badge, when it changed, its tabs, its description, its
// steps by phase drawn smaller to fit the tablet's width (the full steps are
// on How it works), the agent it runs, its file rendered read-only and its one
// file. On a tablet the item replaces the list, under the back row to Toolkit.
// The data is D8's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

export const workflowOpenTablet = {
  title: 'a workflow open on a tablet, with its steps by phase drawn smaller',
  frames: [{ id: 'T18', node: '487:527', viewport: 'tablet' }],
  data: { ...workflowOpen.data },
  ui: { ...workflowOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
