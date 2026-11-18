// Figma Toolkit M29 "M29 · A workflow’s evals": the workflow skill-eval-round
// open on the phone on its Evals tab, with T26's data (workflowEvalsTablet,
// D27's evals), under M21's header. Copy word for word from
// references/toolkit/M29/frame.json; every string is T26's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowEvalsTablet } from './workflowEvalsTablet.ts'

export const workflowEvalsPhone = {
  title: 'a workflow’s evals on the phone, under the workflow’s header',
  frames: [{ id: 'M29', node: '492:4452', viewport: 'phone' }],
  data: { ...workflowEvalsTablet.data },
  ui: { ...workflowEvalsTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
