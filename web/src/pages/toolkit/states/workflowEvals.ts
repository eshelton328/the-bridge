// Figma Toolkit D27 "D27 · A workflow’s evals": the workflow skill-eval-round
// open beside the list, as in D8 (workflowOpen), on its Evals tab. A workflow
// has no eval cases, so the status panel says so, and the panel under it
// lists the gates that check each run; its "from the file" opens the Files
// tab, whose one file holds the Gates section. Copy word for word from
// references/toolkit/D27/frame.json (shared/evals.ts); the list is D8's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { withEvals } from './shared/evals.ts'
import { workflowOpen } from './workflowOpen.ts'

export const workflowEvals = {
  title: 'a workflow open beside the list, on Evals',
  frames: [{ id: 'D27', node: '492:1062', viewport: 'desktop' }],
  data: {
    ...workflowOpen.data,
    // "from the file" opens the Files tab, with D35's browser, which workflowOpen's detail carries.
    details: withEvals(workflowOpen.data.details),
  },
  ui: { ...workflowOpen.ui, itemTab: 'evals' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
