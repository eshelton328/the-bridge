// Every state of the Settings page, by id: one per PNG reference in
// references/settings/ (d-119). scripts/genRegistry.ts reads the file names
// in this folder; each must be a key here and a story.
import { settingsDesktop } from './settingsDesktop.ts'
import { settingsDesktopLight } from './settingsDesktopLight.ts'
import { settingsTablet } from './settingsTablet.ts'
import { settingsTabletLight } from './settingsTabletLight.ts'
import { settingsTabletWide } from './settingsTabletWide.ts'
import { settingsTabletWideLight } from './settingsTabletWideLight.ts'
import { settingsPhone } from './settingsPhone.ts'
import { settingsPhoneLight } from './settingsPhoneLight.ts'
import { moreDrawer } from './moreDrawer.ts'

export const settingsStates = {
  settingsDesktop,
  settingsDesktopLight,
  settingsTablet,
  settingsTabletLight,
  settingsTabletWide,
  settingsTabletWideLight,
  settingsPhone,
  settingsPhoneLight,
  moreDrawer,
}
