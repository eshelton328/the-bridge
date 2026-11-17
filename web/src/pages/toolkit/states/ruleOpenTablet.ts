// Figma Toolkit T17 "T17 · A rule": the rule skills open on the iPad mini,
// with the same Overview as D4 (ruleOpen): its description, when it loads and
// rules/skills.md rendered read-only, with no side column. On a tablet the
// item replaces the list, under the back row to Toolkit that holds Discuss and
// Show on map, as on T3. The data is D4's, as T3's is D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleOpen } from './ruleOpen.ts'

export const ruleOpenTablet = {
  title: 'a rule open on a tablet, in place of the list',
  frames: [{ id: 'T17', node: '487:270', viewport: 'tablet' }],
  data: { ...ruleOpen.data },
  ui: { ...ruleOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
