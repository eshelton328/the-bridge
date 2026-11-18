// Figma Toolkit M23 "M23 · A rule’s activity": the rule skills open on the
// phone on its Activity tab, with T20's data (ruleActivityTablet), under
// M19's header; the tabs scroll sideways so Activity shows. Copy word for
// word from references/toolkit/M23/frame.json; every string is T20's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleActivityTablet } from './ruleActivityTablet.ts'

export const ruleActivityPhone = {
  title: 'a rule’s activity on the phone, under the rule’s header',
  frames: [{ id: 'M23', node: '491:8232', viewport: 'phone' }],
  data: { ...ruleActivityTablet.data },
  ui: { ...ruleActivityTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
