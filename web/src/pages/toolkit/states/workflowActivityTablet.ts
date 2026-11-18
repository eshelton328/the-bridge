// Figma Toolkit T22 "T22 · A workflow’s activity": the workflow
// skill-eval-round open on the iPad mini on its Activity tab, with D23's
// data (workflowActivity), under the workflow's header, as T26 is. Copy word
// for word from references/toolkit/T22/frame.json; every string is D23's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowActivity } from './workflowActivity.ts'

export const workflowActivityTablet = {
  title: 'a workflow’s activity on a tablet, under the workflow’s header',
  frames: [{ id: 'T22', node: '491:7348', viewport: 'tablet' }],
  data: { ...workflowActivity.data },
  ui: { ...workflowActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
