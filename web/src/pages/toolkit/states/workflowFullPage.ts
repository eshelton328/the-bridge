// Figma Toolkit D13 "D13 · A workflow, full page": the workflow
// skill-eval-round opened with Open full page (D8's data, workflowOpen), on
// a page of its own without the list, on its How it works tab: the breadcrumb
// Toolkit › Workflows › skill-eval-round with Discuss and Show on map, the
// description, the flow from the Mermaid flow and the steps table (gates in
// amber, steps 4 and 5 in parallel, the stop and the loop back to it), step 4
// selected with its fields, the gates and the rounds from git log. Copy word
// for word from references/toolkit/D13/frame.json. The page's data is on
// D8's item (workflowOpen.ts), so Open full page from D8 shows this page;
// this state adds D13's description and when it runs.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

const details = workflowOpen.data.details.map((d) =>
  d.path === 'workflows/skill-eval-round.md'
    ? {
        ...d,
        changed: 'changed 6 days ago · run by hand',
        description:
          'Runs one pre-registered eval round for a skill on both model families, grades every run with the other family, and stops for the owner to decide. The second of two stages: skill-eval-cases builds the cases.',
      }
    : d,
)

export const workflowFullPage = {
  title: 'a workflow on a page of its own, with its flow, the selected step, its gates and its rounds',
  frames: [{ id: 'D13', node: '446:2', viewport: 'desktop' }],
  data: { ...workflowOpen.data, details },
  ui: { ...workflowOpen.ui, itemTab: 'how', flowFullPage: true, flowStep: '4' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
