// Figma Toolkit M25 "M25 · A workflow’s activity": the workflow
// skill-eval-round open on the phone on its Activity tab, with T22's data
// (workflowActivityTablet), under M21's header. Copy word for word from
// references/toolkit/M25/frame.json; every string is T22's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowActivityTablet } from './workflowActivityTablet.ts'

export const workflowActivityPhone = {
  title: 'a workflow’s activity on the phone, under the workflow’s header',
  frames: [{ id: 'M25', node: '491:8866', viewport: 'phone' }],
  data: { ...workflowActivityTablet.data },
  ui: { ...workflowActivityTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
