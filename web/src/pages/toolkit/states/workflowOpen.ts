// Figma Toolkit D8 "D8 · A workflow open": the workflow skill-eval-round
// opens beside the list, on its Overview tab: its kind, name and path badge
// (a file, so the file icon), when it changed, its tabs, its description,
// its steps by phase (check, run, grade, decide) from the Mermaid flow in its
// file, the agent it runs, workflows/skill-eval-round.md rendered read-only,
// and its one file. Copy word for word from references/toolkit/D08/frame.json.
// The list beside it is D9's (hookOpen: D4's list with only the Rules,
// Workflows and Hooks groups); D8 draws the same rows.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

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
}

export const workflowOpen = {
  title: 'a workflow open beside the list, with its steps by phase',
  frames: [{ id: 'D8', node: '433:631', viewport: 'desktop' }],
  data: { ...hookOpen.data, details: [skillEvalRound] },
  ui: { ...hookOpen.ui, open: 'workflows/skill-eval-round.md' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
