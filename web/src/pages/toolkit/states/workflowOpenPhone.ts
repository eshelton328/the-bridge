// Figma Toolkit M21 "M21 · A workflow": the workflow skill-eval-round open on
// the phone, on its Overview tab, with D8's content (workflowOpen): its kind,
// when it changed, its name, path badge and tabs, its description, the steps'
// header with Open full page, the agent it runs, and, in place of the steps
// by phase (too wide for the phone), a line that sends the reader to How it
// works; then its file rendered read-only and its one file. On the phone the
// item replaces the list, under the back row to Toolkit with Discuss and Show
// on map as icon buttons, as M2 and M20 have it. The data is D8's, as T18's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

export const workflowOpenPhone = {
  title: 'a workflow open on the phone, its steps left to How it works',
  frames: [{ id: 'M21', node: '487:1677', viewport: 'phone' }],
  data: { ...workflowOpen.data },
  ui: { ...workflowOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
