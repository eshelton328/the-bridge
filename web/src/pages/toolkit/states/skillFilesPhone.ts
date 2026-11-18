// Figma Toolkit M5 "M5 · Files": the skill writer open on the phone on its
// Files tab, with T4's files (skillFilesTablet). The phone shows the tree with
// no viewer under it: the title over the tabs, the skill's folder in the
// toolkit over the tree, each folder with its role and only scripts/ open, and
// check marked as the file opened last. A file opens on a page of its own (M6
// and M8). The copy button sits in the back row with Discuss and Show on map.
// Copy word for word from references/toolkit/M05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileNode, ToolkitUi } from '../types.ts'
import { skillFilesTablet } from './skillFilesTablet.ts'

// M5 435:220, 435:285: the phone's role lines are shorter than the tablet's.
const captions: Readonly<Record<string, string>> = {
  'SKILL.md': 'When to use, steps, rules',
  'evals/': 'Never loaded into a session',
}
// M5 435:250: a script's count reads "437 lines", as on a tablet.
const lines = (node: ToolkitFileNode): ToolkitFileNode =>
  typeof node.count === 'number' && node.type !== 'folder' ? { ...node, count: `${String(node.count)} lines` } : node
const phone = (node: ToolkitFileNode): ToolkitFileNode => {
  const caption = captions[node.path] ?? node.caption
  const children = node.path === 'scripts/' ? node.children?.map(lines) : node.children
  return {
    ...node,
    ...(caption === undefined ? {} : { caption }),
    ...(children === undefined ? {} : { children }),
  }
}

const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...b,
  tree: b.tree.map(phone),
  // M5 435:242: only scripts/ is open.
  expanded: ['scripts/'],
})

export const skillFilesPhone = {
  title: 'a skill’s files on the phone, the tree with a file per row',
  frames: [{ id: 'M5', node: '435:6', viewport: 'phone' }],
  data: {
    ...skillFilesTablet.data,
    details: skillFilesTablet.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  // M5 435:244: check is marked, the file opened last.
  ui: { ...skillFilesTablet.ui, file: 'scripts/check' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
