// Figma Toolkit M37 "M37 · A workflow’s files": the workflow skill-eval-round
// open on the phone on its Files tab, with T34's files (workflowFilesTablet).
// The workflow keeps its header as on M21: the kind badge with when it
// changed, the name and the path badge. The phone shows the tree with no
// viewer under it: the workflow's folder in the toolkit, its one design doc,
// whose role line says its length and kind, and the harness/ folder open
// with the scripts its steps run, which are outside the toolkit. Copy word
// for word from references/toolkit/M37/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { workflowFilesTablet } from './workflowFilesTablet.ts'

// M37 494:5255, 494:5264: the phone's role lines are shorter than the tablet's.
const captions: Readonly<Record<string, string>> = {
  'skill-eval-round.md': '93 lines · markdown',
  'harness/': 'Outside the toolkit',
}
const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...b,
  tree: b.tree.map((node) => {
    const caption = captions[node.path]
    return caption === undefined ? node : { ...node, caption }
  }),
})

export const workflowFilesPhone = {
  title: 'a workflow’s files on the phone, its doc and the harness scripts',
  frames: [{ id: 'M37', node: '494:4974', viewport: 'phone' }],
  data: {
    ...workflowFilesTablet.data,
    details: workflowFilesTablet.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  ui: { ...workflowFilesTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
