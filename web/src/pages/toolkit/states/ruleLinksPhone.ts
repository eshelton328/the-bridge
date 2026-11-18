// Figma Toolkit M31 "M31 · A rule’s links": the rule skills open on the
// phone on its Links tab, with T28's data (ruleLinksTablet, D29's links): the
// rule links to one skill and nothing links to it. Its `links` does not set
// `named`, so the item keeps M19's header (Back to Toolkit, the kind badge with
// when it changed, the name and the path badge) over the tabs. The graph
// stands upright with the reason in the side over the rule, and the two
// panels stand one under the other. Copy word for word from
// references/toolkit/M31/frame.json; every string is T28's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleLinksTablet } from './ruleLinksTablet.ts'

export const ruleLinksPhone = {
  title: 'a rule’s links on the phone, under the rule’s header',
  frames: [{ id: 'M31', node: '493:5329', viewport: 'phone' }],
  data: { ...ruleLinksTablet.data },
  ui: { ...ruleLinksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
