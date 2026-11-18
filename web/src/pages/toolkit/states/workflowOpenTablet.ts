// Figma Toolkit T18 "T18 · A workflow": the workflow skill-eval-round open on
// the iPad mini, on its Overview tab, with D8's content (workflowOpen): its
// kind, name, path badge, when it changed, its tabs, its description, its
// steps by phase drawn smaller to fit the tablet's width (the full steps are
// on How it works), the agent it runs, its file rendered read-only and its one
// file. On a tablet the item replaces the list, under the back row to Toolkit.
// The data is D8's, with T8's page for Open full page.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowFullPageTablet } from './workflowFullPageTablet.ts'
import { workflowOpen } from './workflowOpen.ts'

// Open full page shows the workflow's own page as T8 has it: the item carries T8's flow.
const details = workflowOpen.data.details.map((d) => {
  const flowPage = workflowFullPageTablet.data.details.find((p) => p.path === d.path)?.flowPage
  return flowPage === undefined ? d : { ...d, flowPage }
})

export const workflowOpenTablet = {
  title: 'a workflow open on a tablet, with its steps by phase drawn smaller',
  frames: [{ id: 'T18', node: '487:527', viewport: 'tablet' }],
  data: { ...workflowOpen.data, details },
  ui: { ...workflowOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
