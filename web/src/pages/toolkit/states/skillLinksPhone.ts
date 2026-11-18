// Figma Toolkit M17 "M17 · A skill’s links": the skill writer open on the
// phone on its Links tab, with T15's data (skillLinksTablet, D19's links with
// `named`): the back row names the item (Toolkit › writer) and the title sits
// over the tabs. The graph stands upright, the items that name writer over it
// and the items it names under it, and the two panels stand one under the
// other. Copy word for word from references/toolkit/M17/frame.json; every
// string is T15's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillLinksTablet } from './skillLinksTablet.ts'

export const skillLinksPhone = {
  title: 'a skill’s links on the phone, the graph upright',
  frames: [{ id: 'M17', node: '482:1030', viewport: 'phone' }],
  data: { ...skillLinksTablet.data },
  ui: { ...skillLinksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
