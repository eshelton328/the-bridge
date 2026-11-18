// Figma Toolkit M15 "M15 · A skill’s activity": the skill writer open on the
// phone on its Activity tab, with T13's data (skillActivityTablet: the back
// row names the item, Toolkit › writer). The tabs scroll sideways so
// Activity shows, the key figures sit two by two with no caption, and the
// list runs under the tab bar. Copy word for word from
// references/toolkit/M15/frame.json; every string is T13's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillActivityTablet } from './skillActivityTablet.ts'

export const skillActivityPhone = {
  title: 'a skill’s activity on the phone, the tabs scrolled to Activity',
  frames: [{ id: 'M15', node: '474:1012', viewport: 'phone' }],
  data: { ...skillActivityTablet.data },
  ui: { ...skillActivityTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
