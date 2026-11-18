// Figma Toolkit D23 "D23 · A workflow’s activity": the workflow
// skill-eval-round open beside the list, as in D8 (workflowOpen), on its
// Activity tab. No Workflow tool has run it yet, so the tab shows the rounds
// from the ledgers; a tap on a round opens its skill on its Evals tab
// (writer, D20) or, for a skill with no Evals tab, on its Overview, from
// D8's `evalTargets` (shared/activityTargets.ts). Copy word for word from
// references/toolkit/D23/frame.json; the list is D8's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

export const workflowActivity = {
  title: 'a workflow open beside the list, on Activity',
  frames: [{ id: 'D23', node: '491:5324', viewport: 'desktop' }],
  data: { ...workflowOpen.data },
  ui: { ...workflowOpen.ui, itemTab: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
