// Figma Toolkit T15 "T15 · A skill’s links": the skill writer open on the iPad
// mini on its Links tab, with D19's links (skillLinks). On a tablet the item
// replaces the list, under the back row that names it (Toolkit › writer), and
// the kind badge and path rows are left out, as on T10: the title sits over
// the tabs. The graph is narrower and the two panels stand one under the
// other. Copy word for word from references/toolkit/T15/frame.json; every
// string is D19's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillLinks } from './skillLinks.ts'

export const skillLinksTablet = {
  title: 'a skill’s links on a tablet, the panels under the graph',
  frames: [{ id: 'T15', node: '482:661', viewport: 'tablet' }],
  data: {
    ...skillLinks.data,
    details: skillLinks.data.details.map((d) =>
      d.links === undefined ? d : { ...d, links: { ...d.links, named: true } },
    ),
  },
  ui: { ...skillLinks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
