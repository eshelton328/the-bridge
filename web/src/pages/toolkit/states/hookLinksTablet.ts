// Figma Toolkit T31 "T31 · A hook’s links": the hook commit-msg open on the
// iPad mini on its Links tab, with D32's links (hookLinks): the hook and the
// rule it enforces, commits-and-prs, name each other, so the rule stands on
// both sides. On a tablet the item replaces the list, under the back row to
// Toolkit, and keeps T19's header (the kind badge, the name and the path row)
// over the tabs. The graph is narrower and the two panels stand one under
// the other. Copy word for word from references/toolkit/T31/frame.json;
// every string is D32's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookLinks } from './hookLinks.ts'

export const hookLinksTablet = {
  title: 'a hook’s links on a tablet, under the hook’s header',
  frames: [{ id: 'T31', node: '493:4806', viewport: 'tablet' }],
  data: { ...hookLinks.data },
  ui: { ...hookLinks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
