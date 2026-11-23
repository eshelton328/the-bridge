// Settings M2 (references/settings/M02, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on the phone, Light. The data is D1's with Mode set to Light.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsPhoneLight = {
  title: 'The Settings page on the phone, Light',
  frames: [{ id: 'M2', node: 'lab a52ab2d4', viewport: 'phone' }],
  data: { ...settingsDesktop.data, settings: { ...settingsDesktop.data.settings, mode: 'light' } },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
