// Figma Toolkit M33 "M33 · A workflow’s links": the workflow
// skill-eval-round open on the phone on its Links tab, with T30's data
// (workflowLinksTablet, D31's links): it names the stage before it and the
// agent it runs, and both name it. The workflow keeps its header (Back to
// Toolkit, the kind badge with when it changed, the name and the path badge)
// over the tabs, as on M21. The graph stands upright and the two panels
// stand one under the other. Copy word for word from
// references/toolkit/M33/frame.json; every string is T30's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowLinksTablet } from './workflowLinksTablet.ts'

export const workflowLinksPhone = {
  title: 'a workflow’s links on the phone, under the workflow’s header',
  frames: [{ id: 'M33', node: '493:6239', viewport: 'phone' }],
  data: { ...workflowLinksTablet.data },
  ui: { ...workflowLinksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
