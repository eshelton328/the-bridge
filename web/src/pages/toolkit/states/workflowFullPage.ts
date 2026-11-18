// Figma Toolkit D13 "D13 · A workflow, full page": the workflow
// skill-eval-round opened with Open full page (D8's data, workflowOpen), on
// a page of its own without the list, on its How it works tab: the breadcrumb
// Toolkit › Workflows › skill-eval-round with Discuss and Show on map, the
// description, the flow from the Mermaid flow and the steps table (gates in
// amber, steps 4 and 5 in parallel, the stop and the loop back to it), step 4
// selected with its fields, the gates and the rounds from git log. Copy word
// for word from references/toolkit/D13/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

const flowPage: NonNullable<ToolkitItemDetailView['flowPage']> = {
  label: 'Steps · from the Mermaid flow and the steps table',
  legend: [
    { type: 'gate', label: 'gate' },
    { type: 'script', label: 'script' },
    { type: 'agent', label: 'agent' },
    { type: 'person', label: 'person' },
  ],
  stages: [
    [
      {
        id: 'pre-registered',
        mark: '?',
        title: 'Pre-registered?',
        type: 'gate',
        notes: ['The ledger names method 0.7.', 'No other round holds the eval lock (G2).'],
      },
    ],
    [
      {
        id: '1',
        mark: '1',
        title: 'Runs',
        type: 'step',
        uses: { text: 'run.sh', kind: 'code' },
        notes: ['Each case, model and repeat.'],
        then: 'Then G1 and G6',
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
        notes: ['The other family, in groups of 12.'],
        fields: [
          { label: 'Runs', value: 'grade.py <round> <skill> primary', mono: true },
          { label: 'Agent', value: 'eval-grader, one for each group' },
          { label: 'Input', value: 'blind/, the runs without their labels' },
          { label: 'Output', value: 'grading.json for each run' },
          { label: 'Model', value: 'Codex for Claude runs, Claude for Codex runs' },
          { label: 'Parallel', value: 'groups of 12, 3 at a time; step 5 runs beside it' },
          {
            label: 'If it fails',
            value:
              'grade.py tries a rejected group once more; runs still without a grade are graded by hand and marked in the ledger',
          },
        ],
      },
      {
        id: '5',
        mark: '5',
        title: 'Second grades',
        type: 'step',
        uses: { text: 'grade.py, eval-grader', kind: 'agent' },
        notes: ['The run’s own family, 20 runs or more.'],
      },
    ],
    [
      {
        id: '6',
        mark: '6',
        title: 'Aggregate',
        type: 'step',
        uses: { text: 'blind.py return, aggregate.py', kind: 'code' },
        notes: [],
        then: 'Then the paired difference',
      },
    ],
    [{ id: '7', mark: '7', title: 'Read', type: 'step', notes: ['Main session.', 'Findings go in the ledger.'] }],
    [
      {
        id: 'owner-decides',
        mark: '?',
        title: 'Owner decides',
        type: 'gate',
        notes: ['Done, iterate or redesign.', 'The result goes in the ledger.'],
      },
    ],
  ],
  exit: { from: 'pre-registered', label: 'no', text: 'stop: run skill-eval-cases', workflow: 'skill-eval-cases' },
  loop: { label: 'new failure', under: '6' },
  hint: 'select a step to see it',
  gates: {
    label: 'Gates',
    items: [
      {
        title: 'Before step 1',
        text: 'The ledger entry names method 0.7. run.sh stops if an AGENTS.md sits above the scratch folder (G2) or another round holds the eval lock.',
      },
      {
        title: 'After step 1',
        text: 'G1 lists baselines that read the skill’s files; aggregate.py leaves them out. G6 lists runs that touched the brain, for a check by hand.',
      },
      {
        title: 'After step 6',
        text: 'The decision reads the paired difference for the deciding model, and the agreement between the two graders.',
      },
    ],
  },
  rounds: {
    label: 'Rounds in the ledgers',
    source: 'from git log',
    items: [
      { name: 'readme · cross-family x1', date: 'Nov 9' },
      { name: 'writer · cross-family x1', date: 'Nov 9' },
      { name: 'ambitious · cross-family x1', date: 'Nov 9' },
      { name: 'writer · round 6', date: 'Nov 8' },
    ],
    note: 'Cost from the ledgers: writer round 1 $58.98; agents-md round 4 $27. Step status for a live run needs a run.json for each run (proposal).',
  },
}

const details = workflowOpen.data.details.map((d) =>
  d.path === 'workflows/skill-eval-round.md'
    ? {
        ...d,
        changed: 'changed 6 days ago · run by hand',
        description:
          'Runs one pre-registered eval round for a skill on both model families, grades every run with the other family, and stops for the owner to decide. The second of two stages: skill-eval-cases builds the cases.',
        flowPage,
      }
    : d,
)

export const workflowFullPage = {
  title: 'a workflow on a page of its own, with its flow, the selected step, its gates and its rounds',
  frames: [{ id: 'D13', node: '446:2', viewport: 'desktop' }],
  data: { ...workflowOpen.data, details },
  ui: { ...workflowOpen.ui, itemTab: 'how', flowFullPage: true, flowStep: '4' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
