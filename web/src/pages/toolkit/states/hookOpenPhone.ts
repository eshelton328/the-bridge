// Figma Toolkit M22 "M22 · A hook": the hook commit-msg open on the phone, with
// the same Overview as D9 and T19 (hookOpen): its description, when it runs (the
// git event, its state, the rule it enforces, its test) as two rows of two
// cards, the first lines of its script as code and its two files under it. On
// the phone the hook replaces the list, under the back row to Toolkit that
// holds Discuss and Show on map as icon buttons, as M2's skill and M19's rule
// do; when it changed sits beside the kind badge. The data is D9's, as T19's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

export const hookOpenPhone = {
  title: 'a hook open on the phone, in place of the list',
  frames: [{ id: 'M22', node: '487:1998', viewport: 'phone' }],
  data: { ...hookOpen.data },
  ui: { ...hookOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
