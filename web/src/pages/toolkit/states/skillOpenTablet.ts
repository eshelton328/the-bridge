// Figma Toolkit T3 "T3 · A skill": the skill writer open on the iPad mini,
// with the same Overview as D3 (skillOpen): its description, SKILL.md and its
// files. On a tablet the item replaces the list, under the back row to
// Toolkit that holds Discuss and Show on map. The data is D3's, so the list
// that Back returns to is T1's (toolkitListTablet).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillOpenTablet = {
  title: 'a skill open on a tablet, in place of the list',
  frames: [{ id: 'T3', node: '424:4092', viewport: 'tablet' }],
  data: { ...skillOpen.data },
  ui: { ...skillOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
