// Figma Toolkit M27 "M27 · A rule’s evals": the rule skills open on the phone
// on its Evals tab, with T24's data (ruleEvalsTablet, D25's evals), under
// M19's header (Back to Toolkit, the kind badge with when it changed, the name
// and the path badge). Copy word for word from
// references/toolkit/M27/frame.json; every string is T24's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleEvalsTablet } from './ruleEvalsTablet.ts'

export const ruleEvalsPhone = {
  title: 'a rule’s evals on the phone, under the rule’s header',
  frames: [{ id: 'M27', node: '492:3839', viewport: 'phone' }],
  data: { ...ruleEvalsTablet.data },
  ui: { ...ruleEvalsTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
