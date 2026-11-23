// The Settings page's screens (screen review R10): the states that draw
// each screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/SettingsScreens.stories.tsx. Every state is in exactly
// one screen (states/screens.test.ts).
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { settingsStates } from './index.ts'

export const settingsScreens = {
  dark: { title: 'Settings in Dark', desktop: 'settingsDesktop', tablet: 'settingsTablet', phone: 'settingsPhone' },
  light: {
    title: 'Settings in Light',
    desktop: 'settingsDesktopLight',
    tablet: 'settingsTabletLight',
    phone: 'settingsPhoneLight',
  },
  wide: { title: 'Settings on an iPad in landscape', tablet: 'settingsTabletWide' },
  wideLight: { title: 'Settings on an iPad in landscape, Light', tablet: 'settingsTabletWideLight' },
  more: { title: 'The More drawer', phone: 'moreDrawer' },
} as const satisfies ScreenMap<keyof typeof settingsStates>
