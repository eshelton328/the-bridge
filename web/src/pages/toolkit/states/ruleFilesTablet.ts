// Figma Toolkit T32 "T32 · A rule’s files": the rule skills open on the iPad
// mini on its Files tab, with D33's files (ruleFiles). On a tablet the item
// replaces the list, under the back row to Toolkit, and keeps its header as on
// T17: the kind badge, the name and the path row. A rule is one file, so the
// tree has one row, skills.md, whose role line ends with its length; under
// the tree the viewer shows it rendered, its title and first paragraph, with
// the Rendered and Source switch, and no line on when it loads. Copy word for
// word from references/toolkit/T32/frame.json; the list Back returns to is
// D33's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { ruleFiles } from './ruleFiles.ts'

// T32 494:2979, 494:3056: the role line names the length, and the viewer renders the rule's first lines.
const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'skills.md',
      name: 'skills.md',
      caption: 'The rule. Claude Code loads it by the paths in its frontmatter. 104 lines.',
    },
  ],
  expanded: [],
  selected: 'skills.md',
  views: [
    {
      path: 'skills.md',
      meta: 'Markdown · 104 lines · the rule',
      blocks: [
        { type: 'title', text: 'Skills' },
        {
          type: 'paragraph',
          text: 'How every skill in the toolkit is built. A skill is a procedure an agent loads only when a task needs it.',
        },
      ],
    },
  ],
}

export const ruleFilesTablet = {
  title: 'a rule’s files on a tablet, the rule rendered under the tree',
  frames: [{ id: 'T32', node: '494:2784', viewport: 'tablet' }],
  data: {
    ...ruleFiles.data,
    details: ruleFiles.data.details.map((d) => (d.path === 'rules/skills.md' ? { ...d, browser } : d)),
  },
  ui: { ...ruleFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
