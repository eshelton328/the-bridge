// Figma Toolkit T34 "T34 · A workflow’s files": the workflow
// skill-eval-round open on the iPad mini on its Files tab, with D35's files
// (workflowFiles). On a tablet the item replaces the list, under the back row
// to Toolkit, and keeps its header (the kind badge, the name and the path
// row). The tree lists the design doc, whose role line ends with its length,
// and the harness/ folder open with the six scripts its steps run, each with
// its length in lines; under the tree the viewer shows the doc rendered, its
// title and first paragraph, with the Rendered and Source switch, and no line
// on what names the scripts. Copy word for word from
// references/toolkit/T34/frame.json; the list Back returns to is D35's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileNode, ToolkitUi } from '../types.ts'
import { workflowFiles } from './workflowFiles.ts'

// T34 494:3939: on a tablet a script's count reads "156 lines".
const script = (name: string, lines: number): ToolkitFileNode => ({
  path: `harness/${name}`,
  name,
  count: `${String(lines)} lines`,
  type: 'code',
})

// T34 494:3790, 494:3867: the doc's role line names its length, and the viewer renders the doc's first lines.
const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'skill-eval-round.md',
      name: 'skill-eval-round.md',
      caption: 'Design doc, run by hand. No script yet. 93 lines.',
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
      blocks: [
        { type: 'title', text: 'skill-eval-round' },
        {
          type: 'paragraph',
          text: 'Runs one pre-registered eval round for a skill on both model families, grades every run with the other family, and stops for the owner to decide.',
        },
      ],
    },
  ],
}

export const workflowFilesTablet = {
  title: 'a workflow’s files on a tablet, the design doc rendered under the tree',
  frames: [{ id: 'T34', node: '494:3484', viewport: 'tablet' }],
  data: {
    ...workflowFiles.data,
    details: workflowFiles.data.details.map((d) =>
      d.path === 'workflows/skill-eval-round.md' ? { ...d, browser } : d,
    ),
  },
  ui: { ...workflowFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
