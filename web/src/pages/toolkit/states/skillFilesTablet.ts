// Figma Toolkit T4 "T4 · A skill’s files": the skill writer open on the iPad
// mini on its Files tab, with D6's files (skillFiles). On a tablet the item
// replaces the list, under the back row to Toolkit; the path row names the
// skill's folder and how many files it has. The tree comes first, with each
// folder's role and only references/ open, then the selected file, doc.md,
// rendered under it with the Rendered and Source switch. Copy word for word
// from references/toolkit/T04/frame.json; the files and the list Back returns
// to are D6's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileNode, ToolkitUi } from '../types.ts'
import { skillFiles } from './skillFiles.ts'

// T4 434:425 to 434:460: references/ lists doc.md first, as the file that is open.
const order = ['doc.md', 'ticket.md', 'prd.md', 'artifact.md', 'chat.md', 'examples.md']
const rank = (node: ToolkitFileNode) => order.indexOf(node.name)
// T4 434:431: on a tablet a file's count reads "56 lines".
const lines = (node: ToolkitFileNode): ToolkitFileNode =>
  typeof node.count === 'number' && node.type !== 'folder' ? { ...node, count: `${String(node.count)} lines` } : node
const reordered = (node: ToolkitFileNode): ToolkitFileNode =>
  node.path === 'references/' && node.children !== undefined
    ? { ...node, children: [...node.children].sort((a, b) => rank(a) - rank(b)).map(lines) }
    : node

// T4 434:485: doc.md's bar and its first heading and paragraph, rendered.
const doc = {
  path: 'references/doc.md',
  meta: '56 lines · read on demand',
  blocks: [
    { type: 'title' as const, text: 'Docs' },
    {
      type: 'paragraph' as const,
      text: 'A doc is read by someone looking for one thing: how a part works, how to do a task, or what a value means. They arrive from a link or a search, read the first paragraph, and scan headings for the rest.',
    },
  ],
}

const tablet = (browser: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...browser,
  tree: browser.tree.map(reordered),
  expanded: ['references/'],
  selected: doc.path,
  views: [...browser.views, doc],
  // T4 457:169: the skill's folder in the toolkit and how many files it has.
  badge: { path: 'skills/writer/', meta: '11 files' },
})

export const skillFilesTablet = {
  title: 'a skill’s files on a tablet, a doc rendered under the tree',
  frames: [{ id: 'T4', node: '434:126', viewport: 'tablet' }],
  data: {
    ...skillFiles.data,
    details: skillFiles.data.details.map((d) => (d.browser === undefined ? d : { ...d, browser: tablet(d.browser) })),
  },
  ui: { ...skillFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
