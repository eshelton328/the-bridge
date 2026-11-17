// Figma Toolkit M2 "M2 · A skill": the skill writer open on the phone, with
// the same Overview as D3 and T3 (skillOpen): its description, SKILL.md and
// its files. On the phone the item replaces the list, under the back row to
// Toolkit that holds Discuss and Show on map as icon buttons; when it changed
// sits beside the kind badge. The data is D3's, as T3's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillOpenPhone = {
  title: 'a skill open on the phone, in place of the list',
  frames: [{ id: 'M2', node: '424:4892', viewport: 'phone' }],
  data: { ...skillOpen.data },
  ui: { ...skillOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
