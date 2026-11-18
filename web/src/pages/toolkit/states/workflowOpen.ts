// Figma Toolkit D8 "D8 · A workflow open": the workflow skill-eval-round
// opens beside the list, on its Overview tab: its kind, name and path badge
// (a file, so the file icon), when it changed, its tabs, its description,
// its steps by phase (check, run, grade, decide) from the Mermaid flow in its
// file, the agent it runs, workflows/skill-eval-round.md rendered read-only,
// and its one file. Copy word for word from references/toolkit/D08/frame.json.
// The list beside it is D9's (hookOpen: D4's list with only the Rules,
// Workflows and Hooks groups); D8 draws the same rows. The item also carries
// its own page (D13's flow, gates and rounds, `skillEvalRoundPage`), which
// Open full page shows.
import { workflowResults } from './shared/evalResults.ts'
import { workflowFilesBrowser } from './shared/workflowBrowser.ts'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

/**
 * The workflow's own page (D13, workflowFullPage): its flow from the Mermaid flow and the steps table, step 4's fields,
 * the gates and the rounds. On D8's item too, so Open full page shows it.
 */
const skillEvalRoundPage: NonNullable<ToolkitItemDetailView['flowPage']> = {
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

const skillEvalRound: ToolkitItemDetailView = {
  path: 'workflows/skill-eval-round.md',
  location: 'toolkit/workflows/skill-eval-round.md',
  changed: 'changed 6 days ago',
  description:
    'Runs one pre-registered eval round for a skill on both model families, grades every run with the other family, and stops for the owner to decide.',
  flow: {
    label: 'Steps · from the Mermaid flow in the file',
    phases: [
      {
        label: 'Check',
        steps: [
          {
            row: 0,
            mark: '?',
            title: 'Pre-registered?',
            type: 'gate',
            notes: ['method 0.7 in the ledger', 'eval lock free (G2)'],
            down: 'no',
          },
          {
            row: 2,
            mark: '×',
            title: 'Stop',
            type: 'end',
            notes: ['run skill-eval-cases first', 'or after a new failure'],
          },
        ],
      },
      {
        label: 'Run',
        from: [0],
        fromLabel: 'yes',
        steps: [
          {
            row: 0,
            mark: '1',
            title: 'Runs',
            type: 'step',
            uses: { text: 'run.sh', kind: 'code' },
            notes: ['each case × model × repeat'],
          },
          {
            row: 1,
            mark: '2',
            title: 'Facts',
            type: 'step',
            uses: { text: 'facts.py, jev.py', kind: 'code' },
            notes: ['Jev, 4 at a time'],
          },
          {
            row: 2,
            mark: '3',
            title: 'Blinding',
            type: 'step',
            uses: { text: 'blind.py make', kind: 'code' },
            notes: ['hides which runs had the skill'],
          },
        ],
      },
      {
        label: 'Grade · in parallel',
        parallel: true,
        from: [0, 1],
        sources: [2],
        steps: [
          {
            row: 0,
            mark: '4',
            title: 'Primary grades',
            type: 'step',
            uses: { text: 'eval-grader', kind: 'agent' },
            notes: ['the other model family'],
          },
          {
            row: 1,
            mark: '5',
            title: 'Second grades',
            type: 'step',
            uses: { text: 'eval-grader', kind: 'agent' },
            notes: ['own family, 20 runs or more'],
          },
        ],
      },
      {
        label: 'Decide',
        from: [0],
        sources: [0, 1],
        steps: [
          {
            row: 0,
            mark: '6',
            title: 'Aggregate',
            type: 'step',
            uses: { text: 'aggregate.py', kind: 'code' },
            notes: ['the paired difference'],
          },
          { row: 1, mark: '7', title: 'Read', type: 'step', notes: ['main session', 'findings go in the ledger'] },
          {
            row: 2,
            mark: '?',
            title: 'Owner decides',
            type: 'gate',
            notes: ['done, iterate or redesign', 'result goes in the ledger'],
          },
        ],
      },
    ],
    loop: 'new failure',
    agents: {
      label: 'Agents it runs:',
      items: [{ path: 'agents/eval-grader.md', name: 'eval-grader', kind: 'agent' }],
    },
    note: 'Gates in amber; G1 and G6 run after step 1.',
    elsewhere: 'The steps, gates and loop are on How it works.',
  },
  // The Evals tab (D20, D25 to D28).
  results: workflowResults,
  tabs: [
    { value: 'overview', label: 'Overview' },
    { value: 'how', label: 'How it works' },
    { value: 'files', label: 'Files' },
    { value: 'links', label: 'Links' },
    { value: 'evals', label: 'Evals' },
    { value: 'activity', label: 'Activity' },
  ],
  preview: {
    file: 'skill-eval-round.md',
    meta: '93 lines',
    blocks: [
      { type: 'title', text: 'skill-eval-round' },
      {
        type: 'paragraph',
        text: 'It is the second of two stages; skill-eval-cases builds the cases and ends at the pre-registration this stage starts from.',
      },
      { type: 'heading', text: 'Purpose and trigger' },
      { type: 'paragraph', text: 'Run it when a skill’s ledger holds a round pre-registered under method 0.7.' },
    ],
  },
  files: { count: 1, lines: [{ type: 'file', names: ['skill-eval-round.md'], meta: '93 lines' }] },
  // The Files tab (D35), which the Evals tab's "from the file" opens (D27).
  browser: workflowFilesBrowser,
  flowPage: skillEvalRoundPage,
}

export const workflowOpen = {
  title: 'a workflow open beside the list, with its steps by phase',
  frames: [{ id: 'D8', node: '433:631', viewport: 'desktop' }],
  data: { ...hookOpen.data, details: [skillEvalRound] },
  ui: { ...hookOpen.ui, open: 'workflows/skill-eval-round.md' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
