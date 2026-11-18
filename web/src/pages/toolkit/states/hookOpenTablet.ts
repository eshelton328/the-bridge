// Figma Toolkit T19 "T19 · A hook": the hook commit-msg open on the iPad mini,
// with the same Overview as D9 (hookOpen): its description, when it runs (the
// git event, its state, the rule it enforces, its test), the first ten lines
// of its script as code and its two files. On a tablet the item replaces the
// list, under the back row to Toolkit that holds Discuss and Show on map, as
// on T3 and T17. The data is D9's, as T17's is D4's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

export const hookOpenTablet = {
  title: 'a hook open on a tablet, in place of the list',
  frames: [{ id: 'T19', node: '487:895', viewport: 'tablet' }],
  data: { ...hookOpen.data },
  ui: { ...hookOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
