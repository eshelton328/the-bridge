// Figma Artifacts M3 "M3 · Filter": on the phone Filter opens its menu as a
// sheet from the bottom that covers the tab bar, over M1's library, as on
// the iPad mini (T3). Copy word for word from
// references/artifacts/M03/frame.json. It is M1's library with T3's sheet
// (D3's menu, with Clear and "Show 7 artifacts") open and D3's two boxes
// checked (Claude artifacts and ncc-1701); Show 7 artifacts applies them and
// the scrim closes the sheet, and both return to M1 with the boxes kept.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { filterTablet } from './filterTablet.ts'
import { libraryPhone } from './libraryPhone.ts'

export const filterPhone = {
  title: 'The Filter sheet open over the library on a phone',
  frames: [{ id: 'M3', node: '407:2', viewport: 'phone' }],
  // M3 407:501: the sheet's footer frame around Show has its own node id in this frame.
  data: { ...libraryPhone.data, filterMenu: { ...filterTablet.data.filterMenu, footLayer: '407:501' } },
  ui: { ...libraryPhone.ui, filterOpen: true, filterChecks: filterTablet.ui.filterChecks },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
