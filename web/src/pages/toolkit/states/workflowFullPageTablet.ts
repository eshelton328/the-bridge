// Figma Toolkit T08 "T8 · A workflow": the workflow skill-eval-round on a page of
// its own on the iPad mini, on its How it works tab (D13's data, workflowFullPage):
// the breadcrumb Toolkit › Workflows › skill-eval-round with Discuss and Show on
// map, the kind badge, the name, the path row, the tabs and the description,
// then the flow as a column of steps (steps 4 and 5 side by side) and the
// selected step's details under it. Figma's tablet has shorter lines: one line
// of notes for each step, a gate that names the ledger and the stop in its note,
// no stop box, no loop label and no hint, and five fields for step 4. Copy word
// for word from references/toolkit/T08/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { workflowFullPage } from './workflowFullPage.ts'

type FlowPage = NonNullable<ToolkitItemDetailView['flowPage']>

const tabletStages: FlowPage['stages'] = [
  [
    {
      id: 'pre-registered',
      mark: '?',
      title: 'Pre-registered in the ledger?',
      type: 'gate',
      notes: ['Method 0.7 and a free eval lock (G2). If not: stop, run skill-eval-cases.'],
    },
  ],
  [
    {
      id: '1',
      mark: '1',
      title: 'Runs',
      type: 'step',
      uses: { text: 'run.sh', kind: 'code' },
      notes: ['Each case, model and repeat. Then G1 and G6.'],
    },
  ],
  [
    {
      id: '2',
      mark: '2',
      title: 'Facts',
      type: 'step',
      uses: { text: 'facts.py, jev.py', kind: 'code' },
      notes: ['Jev scores prose, 4 at a time.'],
    },
  ],
  [
    {
      id: '3',
      mark: '3',
      title: 'Blinding',
      type: 'step',
      uses: { text: 'blind.py make', kind: 'code' },
      notes: ['Hides which runs had the skill.'],
    },
  ],
  [
    {
      id: '4',
      mark: '4',
      title: 'Primary grades',
      type: 'step',
      uses: { text: 'grade.py, eval-grader', kind: 'agent' },
      notes: ['The other family.'],
      fields: [
        { label: 'Input', value: 'blind/' },
        { label: 'Output', value: 'grading.json for each run' },
        { label: 'Model', value: 'Codex for Claude runs, Claude for Codex runs' },
        { label: 'Parallel', value: 'groups of 12, 3 at a time' },
        { label: 'If it fails', value: 'one more try for each group, then by hand' },
      ],
    },
    {
      id: '5',
      mark: '5',
      title: 'Second grades',
      type: 'step',
      uses: { text: 'grade.py, eval-grader', kind: 'agent' },
      notes: ['Own family, 20 runs or more.'],
    },
  ],
  [
    {
      id: '6',
      mark: '6',
      title: 'Aggregate',
      type: 'step',
      uses: { text: 'blind.py return, aggregate.py', kind: 'code' },
      notes: ['aggregate.json, then the paired difference.'],
    },
  ],
  [{ id: '7', mark: '7', title: 'Read', type: 'step', notes: ['The main session writes findings in the ledger.'] }],
  [
    {
      id: 'owner-decides',
      mark: '?',
      title: 'Owner decides',
      type: 'gate',
      notes: ['Done, iterate or redesign. A new failure goes back to skill-eval-cases.'],
    },
  ],
]

const details = workflowFullPage.data.details.map((d) => {
  if (d.flowPage === undefined) return d
  return {
    ...d,
    location: 'workflows/skill-eval-round.md',
    changed: 'run by hand',
    description:
      'Runs one pre-registered eval round for a skill on both model families, grades each run with the other family, and stops for the owner.',
    // T8 has no stop box (the gate's note names the stop), no loop label, no hint and only the selected step's panel
    // under the flow: no gates or rounds.
    flowPage: { label: d.flowPage.label, legend: d.flowPage.legend, stages: tabletStages },
  }
})

export const workflowFullPageTablet = {
  title: 'a workflow on a page of its own on a tablet, its flow as a column of steps and the selected step under it',
  frames: [{ id: 'T8', node: '448:2', viewport: 'tablet' }],
  data: { ...workflowFullPage.data, details },
  ui: { ...workflowFullPage.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
