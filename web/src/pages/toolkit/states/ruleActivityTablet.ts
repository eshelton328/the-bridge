// Figma Toolkit T20 "T20 · A rule’s activity": the rule skills open on the
// iPad mini on its Activity tab, with D21's data (ruleActivity), under the
// rule's header (the kind badge, the name and the path row), as T24 is.
// Copy word for word from references/toolkit/T20/frame.json; every string
// is D21's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleActivity } from './ruleActivity.ts'

export const ruleActivityTablet = {
  title: 'a rule’s activity on a tablet, under the rule’s header',
  frames: [{ id: 'T20', node: '491:6608', viewport: 'tablet' }],
  data: { ...ruleActivity.data },
  ui: { ...ruleActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
