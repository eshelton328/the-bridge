// Figma Toolkit T28 "T28 · A rule’s links": the rule skills open on the iPad
// mini on its Links tab, with D29's links (ruleLinks). On a tablet the item
// replaces the list, under the back row to Toolkit, and keeps T17's header
// (the kind badge, the name and the path row) over the tabs. The rule links
// to one skill and nothing links to it: the graph's left column and the
// Linked from panel say why. The graph is narrower and the two panels stand
// one under the other. Copy word for word from
// references/toolkit/T28/frame.json; every string is D29's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleLinks } from './ruleLinks.ts'

export const ruleLinksTablet = {
  title: 'a rule’s links on a tablet, under the rule’s header',
  frames: [{ id: 'T28', node: '493:3184', viewport: 'tablet' }],
  data: { ...ruleLinks.data },
  ui: { ...ruleLinks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
