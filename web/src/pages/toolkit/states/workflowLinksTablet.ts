// Figma Toolkit T30 "T30 · A workflow’s links": the workflow
// skill-eval-round open on the iPad mini on its Links tab, with D31's links
// (workflowLinks): the stage before it, skill-eval-cases, and the agent it
// runs, eval-grader. On a tablet the item replaces the list, under the back
// row to Toolkit, and keeps T18's header (the kind badge, the name and the
// path row) over the tabs. The graph is narrower and the two panels stand
// one under the other. Copy word for word from
// references/toolkit/T30/frame.json; every string is D31's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowLinks } from './workflowLinks.ts'

export const workflowLinksTablet = {
  title: 'a workflow’s links on a tablet, under the workflow’s header',
  frames: [{ id: 'T30', node: '493:4194', viewport: 'tablet' }],
  data: { ...workflowLinks.data },
  ui: { ...workflowLinks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
