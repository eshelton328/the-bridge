// Figma Toolkit M09 "M9 · A workflow": the workflow skill-eval-round on a page of
// its own on the phone, on its How it works tab (T8's data,
// workflowFullPageTablet): the breadcrumb Toolkit › skill-eval-round with Discuss
// and Show on map as icon buttons, the kind badge with "run by hand" beside it, the
// name, the tabs and the description, then the flow as a column of steps (steps 4
// and 5 side by side). The page runs on under the tab bar; the selected step's
// details come under the column, past the frame's foot. Copy word for word from
// references/toolkit/M09/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowFullPageTablet } from './workflowFullPageTablet.ts'

export const workflowFullPagePhone = {
  title: 'a workflow on a page of its own on the phone, its flow as a column of steps under the breadcrumb',
  frames: [{ id: 'M9', node: '448:317', viewport: 'phone' }],
  data: { ...workflowFullPageTablet.data },
  ui: { ...workflowFullPageTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
