// Figma Toolkit T6 "T6 · A script explained": the skill writer's script check
// open on the iPad mini, on a page of its own on the Files tab, as a script
// with an explanation opens on a tablet. The back row goes back to Files; the
// title and the path badge name the script, with its language and length.
// Under the tabs the Explain and Code switch, then the explanation in a box:
// the overview, the walkthrough with a link to each step's line, and who
// wrote it. Copy word for word from references/toolkit/T06/frame.json; the
// explanation is D10's (scriptExplained).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileView, ToolkitUi } from '../types.ts'
import { scriptExplained } from './scriptExplained.ts'

// T6 457:187: the path row names the script's language and length; the page has no line on what uses it.
const page = (view: ToolkitFileView): ToolkitFileView =>
  view.path === 'scripts/check'
    ? { path: view.path, meta: 'Python · 437 lines', blocks: view.blocks, code: view.code, explain: view.explain }
    : view

const tablet = (browser: ToolkitFileBrowser): ToolkitFileBrowser => ({
  ...browser,
  views: browser.views.map(page),
  // T6 457:183: the badge names the skill's folder in the toolkit and the script's path in it.
  badge: { path: 'skills/writer/', meta: '11 files' },
})

export const scriptExplainedTablet = {
  title: 'a skill’s script explained on a tablet, on a page of its own',
  frames: [{ id: 'T6', node: '440:1698', viewport: 'tablet' }],
  data: {
    ...scriptExplained.data,
    details: scriptExplained.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: tablet(d.browser) },
    ),
  },
  ui: { ...scriptExplained.ui, file: 'scripts/check', filePage: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
