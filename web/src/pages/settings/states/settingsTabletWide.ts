// Settings T3 (references/settings/T03, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on an iPad in landscape, Dark: it keeps the tablet layout. The data is D1's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsTabletWide = {
  title: 'The Settings page on an iPad in landscape, Dark: it keeps the tablet layout',
  frames: [{ id: 'T3', node: 'lab a52ab2d4', viewport: 'tablet' }],
  data: { ...settingsDesktop.data },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
