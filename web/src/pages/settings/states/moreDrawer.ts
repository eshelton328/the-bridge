// Settings M3 (references/settings/M03, a PNG reference: lab a52ab2d4 + d-119):
// The More drawer open over the Settings page on the phone: Artifacts, Toolkit and Settings, Settings selected, then the
// Later items. The data is D1's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'
import { settingsDesktop } from './settingsDesktop.ts'

export const moreDrawer = {
  title: 'The More drawer open over the Settings page on the phone',
  frames: [{ id: 'M3', node: 'lab a52ab2d4', viewport: 'phone' }],
  data: { ...settingsDesktop.data },
  ui: { moreOpen: true },
} satisfies ScreenState<SettingsData, SettingsUi>
