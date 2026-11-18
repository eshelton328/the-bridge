// Figma Toolkit T33 "T33 · An agent’s files": the agent writing-reviewer open
// on the iPad mini on its Files tab, with D34's files (agentFiles), reached
// from the links of the skill writer, as on T7: the back row shows the
// breadcrumb Toolkit › writer › writing-reviewer. The item keeps its header
// (the kind badge, the name and the path row). An agent is one file, its
// prompt, so the tree has one row, whose role line ends with its length;
// under the tree the viewer shows the prompt rendered, its title and first
// line, with the Rendered and Source switch, and no line on what starts it.
// Copy word for word from references/toolkit/T33/frame.json; the list Back
// returns to is D34's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { agentFiles } from './agentFiles.ts'

// T33 494:3350, 494:3427: the role line names the length, and the viewer renders the prompt's first lines.
const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'writing-reviewer.md',
      name: 'writing-reviewer.md',
      caption: 'The prompt. Its model and tools are in the frontmatter. 137 lines.',
    },
  ],
  expanded: [],
  selected: 'writing-reviewer.md',
  views: [
    {
      path: 'writing-reviewer.md',
      meta: 'Markdown · 137 lines · the prompt',
      blocks: [
        { type: 'title', text: 'writing-reviewer' },
        { type: 'paragraph', text: 'You review one draft for a reader who has none of its author’s context.' },
      ],
    },
  ],
}

export const agentFilesTablet = {
  title: 'an agent’s files on a tablet, from the links of a skill',
  frames: [{ id: 'T33', node: '494:3113', viewport: 'tablet' }],
  data: {
    ...agentFiles.data,
    details: agentFiles.data.details.map((d) => (d.path === 'agents/writing-reviewer.md' ? { ...d, browser } : d)),
  },
  ui: { ...agentFiles.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
