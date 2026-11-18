// Figma Toolkit D35 "D35 · A workflow’s files": the workflow skill-eval-round
// open beside the list, as in D8 (workflowOpen), on its Files tab. The
// workflow is one design doc, selected, with what it is; its steps run the
// harness scripts, which are outside the toolkit, so the tree shows the
// harness/ folder open with its six scripts and where they are. The viewer
// shows the doc's first lines as written and the line on what names the
// scripts. Copy word for word from references/toolkit/D35/frame.json. The
// list beside it is D8's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

const script = (name: string, count: number) => ({ path: `harness/${name}`, name, count, type: 'code' as const })

const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'skill-eval-round.md',
      name: 'skill-eval-round.md',
      count: 93,
      caption: 'Design doc, run by hand. No script yet.',
    },
    {
      path: 'harness/',
      name: 'harness/',
      type: 'folder',
      count: 6,
      caption: 'Outside the toolkit, in projects/skill-evals/. One script for each step.',
      children: [
        script('run.sh', 156),
        script('facts.py', 86),
        script('jev.py', 68),
        script('blind.py', 90),
        script('grade.py', 215),
        script('aggregate.py', 208),
      ],
    },
  ],
  expanded: ['harness/'],
  selected: 'skill-eval-round.md',
  views: [
    {
      path: 'skill-eval-round.md',
      meta: 'Markdown · 93 lines · design doc',
      blocks: [],
      code: [
        [{ text: '# skill-eval-round', kind: 'comment' }],
        [],
        [{ text: 'Runs one pre-registered eval round for a skill on both model families,' }],
        [{ text: 'grades every run with the other family, and stops for the owner to decide.' }],
        [{ text: 'It is the second of two stages; [skill-eval-cases](skill-eval-cases.md)' }],
        [{ text: 'builds the cases and ends at the pre-registration this stage starts from.' }],
        [{ text: 'Each step is a script in `projects/skill-evals/harness/`; the steps are' }],
        [{ text: 'the protocol of `projects/skill-evals/method.md` at version 0.7, whose' }],
        [{ text: 'Guards table defines the checks named G1 to G7 here.' }],
        [],
        [{ text: '## Purpose and trigger' }],
        [],
        [{ text: "Run it when a skill's ledger holds a round pre-registered under method" }],
        [{ text: '0.7: what changed, the hypotheses, the models (at least one Claude and one' }],
      ],
      usedBy: { kind: 'skill', text: 'The steps table names the harness script for each step.' },
    },
  ],
}

export const workflowFiles = {
  title: 'a workflow open beside the list, on Files',
  frames: [{ id: 'D35', node: '494:1267', viewport: 'desktop' }],
  data: {
    ...workflowOpen.data,
    details: workflowOpen.data.details.map((d) => (d.path === 'workflows/skill-eval-round.md' ? { ...d, browser } : d)),
  },
  ui: { ...workflowOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
