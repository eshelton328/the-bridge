// Figma Artifacts M8 "M8 · More drawer": on the phone the tab bar's More
// opens the More drawer over the tab bar, on M1's library. Copy word for
// word from references/artifacts/M08/frame.json; the library under the
// scrim is M1's, string for string. The drawer is the shared block
// (blocks/MoreDrawer.tsx): Artifacts, the page on screen, is selected
// with its count, 24. Figma's M8 still puts Toolkit under Later; the
// shared drawer has Toolkit after Artifacts, as Toolkit M4 (d-105).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { libraryPhone } from './libraryPhone.ts'

export const morePhone = {
  title: 'The More drawer open over the library on a phone',
  frames: [{ id: 'M8', node: '415:2', viewport: 'phone' }],
  data: { ...libraryPhone.data },
  ui: { ...libraryPhone.ui, moreOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
