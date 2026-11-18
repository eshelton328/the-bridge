// Figma Toolkit M19 "M19 · A rule": the rule skills open on the phone, with
// the same Overview as D4 and T17 (ruleOpen): its description, when it loads
// and rules/skills.md rendered read-only, with no side column. On the phone the
// rule replaces the list, under the back row to Toolkit that holds Discuss and
// Show on map as icon buttons, as M2's skill does; when it changed sits beside
// the kind badge. The data is D4's, as T17's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleOpen } from './ruleOpen.ts'

export const ruleOpenPhone = {
  title: 'a rule open on the phone, in place of the list',
  frames: [{ id: 'M19', node: '487:1219', viewport: 'phone' }],
  data: { ...ruleOpen.data },
  ui: { ...ruleOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
