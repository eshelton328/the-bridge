// Figma Toolkit D34 "D34 · An agent’s files": the agent writing-reviewer open
// beside the list, as in D7 (agentOpen), on its Files tab. An agent is one
// file, its prompt, so the tree has one row, writing-reviewer.md with what it
// is, selected; the viewer shows its first lines as written, the frontmatter
// with its model and tools first, and the line on what starts the agent. Copy
// word for word from references/toolkit/D34/frame.json. The list beside it is
// D7's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'writing-reviewer.md',
      name: 'writing-reviewer.md',
      count: 137,
      caption: 'The prompt. Its model and tools are in the frontmatter.',
    },
  ],
  expanded: [],
  selected: 'writing-reviewer.md',
  views: [
    {
      path: 'writing-reviewer.md',
      meta: 'Markdown · 137 lines · the prompt',
      blocks: [],
      code: [
        [{ text: '---', kind: 'comment' }],
        [{ text: 'name: writing-reviewer' }],
        [{ text: 'description: Grades a draft doc, ticket, PRD, artifact text or chat answer…' }],
        [{ text: 'tools: Bash, Read, Grep, Glob' }],
        [{ text: 'model: opus' }],
        [{ text: 'codex_effort: high' }],
        [{ text: '---' }],
        [],
        [{ text: "You review one draft for a reader who has none of its author's context." }],
        [{ text: 'You see what that reader will see: the draft, and the sources a careful' }],
        [{ text: 'reader could open to check it. Read the draft as claims to verify, not as' }],
        [{ text: "the author's intent." }],
        [],
        [{ text: '## Inputs' }],
      ],
      usedBy: {
        kind: 'skill',
        text: 'Step 7 of the writer skill starts this agent with the draft, the form and the sources.',
      },
    },
  ],
}

export const agentFiles = {
  title: 'an agent open beside the list, on Files',
  frames: [{ id: 'D34', node: '494:639', viewport: 'desktop' }],
  data: {
    ...agentOpen.data,
    details: agentOpen.data.details.map((d) => (d.path === 'agents/writing-reviewer.md' ? { ...d, browser } : d)),
  },
  ui: { ...agentOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
