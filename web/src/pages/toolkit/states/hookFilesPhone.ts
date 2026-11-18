// Figma Toolkit M38 "M38 · A hook’s files": the hook commit-msg open on the
// phone on its Files tab, with T35's files (hookFilesTablet). The hook keeps
// its header as on M22: the kind badge with when it changed, the name and the
// path badge. The phone shows the tree with no viewer under it: the hook's
// folder in the toolkit, then the script and its tests, each with a role line
// that says its length and kind. Copy word for word from
// references/toolkit/M38/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { hookFilesTablet } from './hookFilesTablet.ts'

// M38 494:5651, 494:5663: the phone's role lines name each script's length and kind.
const captions: Readonly<Record<string, string>> = {
  'commit-msg': '142 lines · script',
  'test-commit-msg': '97 lines · script',
}
const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...b,
  tree: b.tree.map((node) => {
    const caption = captions[node.path]
    return caption === undefined ? node : { ...node, caption }
  }),
})

export const hookFilesPhone = {
  title: 'a hook’s files on the phone, the script and its tests',
  frames: [{ id: 'M38', node: '494:5323', viewport: 'phone' }],
  data: {
    ...hookFilesTablet.data,
    details: hookFilesTablet.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  ui: { ...hookFilesTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
