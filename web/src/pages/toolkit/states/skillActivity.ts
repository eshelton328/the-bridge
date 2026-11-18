// Figma Toolkit D17 "D17 · A skill’s activity": the skill writer open beside
// the list, as in D3 (skillOpen), on its Activity tab: how often it ran,
// where, and which chats loaded it, from the session files. The Overview
// states carry the tab (shared/activity.ts), so a tap on Activity from D3
// gives this state. Copy word for word from references/toolkit/D17/frame.json;
// the list is D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillActivity = {
  title: 'a skill open beside the list, on Activity',
  frames: [{ id: 'D17', node: '474:46', viewport: 'desktop' }],
  data: { ...skillOpen.data },
  ui: { ...skillOpen.ui, itemTab: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
