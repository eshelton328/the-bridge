// Figma Toolkit T24 "T24 · A rule’s evals": the rule skills open on the iPad
// mini on its Evals tab, with D25's data (ruleEvals). Its `results` does not
// set `named`, so the item keeps T17's header (Back to Toolkit, the kind
// badge, the name and the path row) over the tabs. Copy word for word from
// references/toolkit/T24/frame.json; every string is D25's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleEvals } from './ruleEvals.ts'

export const ruleEvalsTablet = {
  title: 'a rule’s evals on a tablet, under the rule’s header',
  frames: [{ id: 'T24', node: '492:2295', viewport: 'tablet' }],
  data: { ...ruleEvals.data },
  ui: { ...ruleEvals.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
