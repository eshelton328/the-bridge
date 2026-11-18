// Figma Toolkit T26 "T26 · A workflow’s evals": the workflow skill-eval-round
// open on the iPad mini on its Evals tab, with D27's data (workflowEvals),
// under T18's header (Back to Toolkit, the kind badge, the name and the path
// row). Copy word for word from references/toolkit/T26/frame.json; every
// string is D27's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowEvals } from './workflowEvals.ts'

export const workflowEvalsTablet = {
  title: 'a workflow’s evals on a tablet, under the workflow’s header',
  frames: [{ id: 'T26', node: '492:3006', viewport: 'tablet' }],
  data: { ...workflowEvals.data },
  ui: { ...workflowEvals.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
