// Settings M1 (references/settings/M01, a PNG reference: lab a52ab2d4 + d-119):
// The Settings page on the phone, Dark. The data is D1's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const settingsPhone = {
  title: 'The Settings page on the phone, Dark',
  frames: [{ id: 'M1', node: 'lab a52ab2d4', viewport: 'phone' }],
  data: { ...settingsDesktop.data },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
