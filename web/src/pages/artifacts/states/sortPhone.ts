// Figma Artifacts M4 "M4 · Sort": on the phone the icon-only Sort opens the
// Sort menu as a sheet from the bottom that covers the tab bar, over M1's
// library, as the Filter sheet does (M3). Copy word for word from
// references/artifacts/M04/frame.json. It is M1's library with D6's sorts
// and Sort menu (the four sorts, each with what it does, and the note),
// Newest first picked; picking a sort closes the sheet, and the scrim
// closes it and keeps the sort.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { libraryPhone } from './libraryPhone.ts'
import { sortOpen } from './sortOpen.ts'

export const sortPhone = {
  title: 'The Sort sheet open over the library on a phone',
  frames: [{ id: 'M4', node: '407:504', viewport: 'phone' }],
  data: { ...libraryPhone.data, sorts: sortOpen.data.sorts, sortMenu: sortOpen.data.sortMenu },
  ui: { ...libraryPhone.ui, sortOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
