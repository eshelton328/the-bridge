// Figma Toolkit T13 "T13 · A skill’s activity": the skill writer open on the
// iPad mini on its Activity tab, with D17's data (skillActivity). Its
// `activity` sets `named`, so the back row names the item (Toolkit › writer)
// and the kind badge and path rows are left out, as on T16; the bar panels
// stand one under the other. Copy word for word from
// references/toolkit/T13/frame.json; every string is D17's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillActivity } from './skillActivity.ts'

export const skillActivityTablet = {
  title: 'a skill’s activity on a tablet, the bar panels one under the other',
  frames: [{ id: 'T13', node: '474:675', viewport: 'tablet' }],
  data: { ...skillActivity.data },
  ui: { ...skillActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
