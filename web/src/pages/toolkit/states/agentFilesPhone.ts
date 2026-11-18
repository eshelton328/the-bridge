// Figma Toolkit M36 "M36 · An agent’s files": the agent writing-reviewer open
// on the phone on its Files tab, with T33's files (agentFilesTablet). As on
// M20 the back row goes to Toolkit, with no breadcrumb (no `ui.from`), and
// the agent keeps its header: the kind badge with when it changed, the name
// and the path badge. The phone shows the tree with no viewer under it: the
// agent's folder in the toolkit, then its one file, the prompt, whose role
// line says its length and kind. Copy word for word from
// references/toolkit/M36/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { agentFiles } from './agentFiles.ts'
import { agentFilesTablet } from './agentFilesTablet.ts'

// M36 494:4970: the phone's role line names the file's length and kind.
const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...b,
  tree: b.tree.map((node) =>
    node.path === 'writing-reviewer.md' ? { ...node, caption: '137 lines · markdown' } : node,
  ),
})

export const agentFilesPhone = {
  title: 'an agent’s files on the phone, its prompt in the tree',
  frames: [{ id: 'M36', node: '494:4671', viewport: 'phone' }],
  data: {
    ...agentFilesTablet.data,
    details: agentFilesTablet.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  // M36 494:4698: Back to Toolkit, with no breadcrumb.
  ui: { ...agentFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
