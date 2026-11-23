// Settings T1 (references/settings/T01, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on an iPad in portrait, Dark. The data is D1's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsTablet = {
  title: 'The Settings page on an iPad in portrait, Dark',
  frames: [{ id: 'T1', node: 'lab a52ab2d4', viewport: 'tablet' }],
  data: { ...settingsDesktop.data },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
