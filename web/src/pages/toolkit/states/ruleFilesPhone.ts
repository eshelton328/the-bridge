// Figma Toolkit M35 "M35 · A rule’s files": the rule skills open on the phone
// on its Files tab, with T32's files (ruleFilesTablet). The rule keeps its
// header as on M19: the kind badge with when it changed, the name and the path
// badge. The phone shows the tree with no viewer under it: the rule's folder
// in the toolkit, then its one file, whose role line says its length and
// kind; the file opens on a page of its own. Copy word for word from
// references/toolkit/M35/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { ruleFilesTablet } from './ruleFilesTablet.ts'

// M35 494:4667: the phone's role line names the file's length and kind.
const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...b,
  tree: b.tree.map((node) => (node.path === 'skills.md' ? { ...node, caption: '104 lines · markdown' } : node)),
})

export const ruleFilesPhone = {
  title: 'a rule’s files on the phone, its one file in the tree',
  frames: [{ id: 'M35', node: '494:4406', viewport: 'phone' }],
  data: {
    ...ruleFilesTablet.data,
    details: ruleFilesTablet.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  ui: { ...ruleFilesTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
