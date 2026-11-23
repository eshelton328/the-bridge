// Settings T4 (references/settings/T04, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on an iPad in landscape, Light. The data is D1's with Mode set to Light.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsTabletWideLight = {
  title: 'The Settings page on an iPad in landscape, Light',
  frames: [{ id: 'T4', node: 'lab a52ab2d4', viewport: 'tablet' }],
  data: { ...settingsDesktop.data, settings: { ...settingsDesktop.data.settings, mode: 'light' } },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
