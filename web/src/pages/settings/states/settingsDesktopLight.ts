// Settings D2 (references/settings/D02, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on the desktop in Light. The data is D1's with Mode set to Light.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsDesktopLight = {
  title: 'The Settings page on the desktop in Light',
  frames: [{ id: 'D2', node: 'lab a52ab2d4', viewport: 'desktop' }],
  data: { ...settingsDesktop.data, settings: { ...settingsDesktop.data.settings, mode: 'light' } },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
