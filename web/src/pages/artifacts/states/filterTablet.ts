// Figma Artifacts T3 "T3 · Filter": on the iPad mini Filter opens its menu
// as a sheet from the bottom that covers the tab bar, over T1's library.
// Copy word for word from references/artifacts/T03/frame.json. It is T1's
// library with the sheet open and D3's two boxes checked (Claude artifacts
// and ncc-1701); Show 7 artifacts applies them and the scrim closes the
// sheet, and both return to T1 with the boxes kept.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { filterOpen } from './filterOpen.ts'
import { libraryTablet } from './libraryTablet.ts'

export const filterTablet = {
  title: 'The Filter sheet open over the library on a tablet',
  frames: [{ id: 'T3', node: '407:1199', viewport: 'tablet' }],
  data: { ...libraryTablet.data },
  ui: { ...libraryTablet.ui, filterOpen: true, filterChecks: filterOpen.ui.filterChecks },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
