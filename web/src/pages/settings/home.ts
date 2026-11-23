// The Settings page as the app opens it, with no ?state= (lib/dataSource.ts):
// D1's data, laid out by the window's width, the More drawer closed. The
// entry puts the settings saved on this device and the live Notifications
// switch over it (d-119). It is not a state: it lives outside states/, so it
// has no frame, story, board or fidelity check.
import type { ScreenState } from '../../lib/screenState.ts'
import { settingsDesktop } from './states/settingsDesktop.ts'
import type { SettingsData, SettingsUi } from './types.ts'

export const settingsHome = {
  title: 'Settings as the app opens',
  frames: [],
  data: { ...settingsDesktop.data },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
