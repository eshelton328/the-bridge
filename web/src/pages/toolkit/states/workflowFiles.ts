// Figma Toolkit D35 "D35 · A workflow’s files": the workflow skill-eval-round
// open beside the list, as in D8 (workflowOpen), on its Files tab. The
// workflow is one design doc, selected, with what it is; its steps run the
// harness scripts, which are outside the toolkit, so the tree shows the
// harness/ folder open with its six scripts and where they are. The viewer
// shows the doc's first lines as written and the line on what names the
// scripts. Copy word for word from references/toolkit/D35/frame.json. The
// list beside it is D8's. The browser is shared (shared/workflowBrowser.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

export const workflowFiles = {
  title: 'a workflow open beside the list, on Files',
  frames: [{ id: 'D35', node: '494:1267', viewport: 'desktop' }],
  // workflowOpen's detail carries the browser (shared/workflowBrowser.ts).
  data: { ...workflowOpen.data },
  ui: { ...workflowOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
