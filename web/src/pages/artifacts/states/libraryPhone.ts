// Figma Artifacts M1 "M1 · Library": the library on the phone as a list with
// small previews, over the tab bar with More selected (the phone opens
// Artifacts from More, d-105). Copy word for word from
// references/artifacts/M01/frame.json. It starts from the D1 library and
// differs from it in one string: the search says "Search artifacts", as on
// the tablet. Earlier shows the five rows the frame draws (406:203 to
// 406:277); its later rows lie below the frame, so they wait for a frame
// that shows them.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

/** How many of a group's rows the frame draws: Earlier's first five; Found keeps its four. */
const inFrame: Record<string, number> = { earlier: 5 }

export const libraryPhone = {
  title: 'The library on a phone, as a list with small previews',
  frames: [{ id: 'M1', node: '406:2', viewport: 'phone' }],
  data: {
    ...library.data,
    searchPlaceholder: 'Search artifacts',
    groups: library.data.groups.map((group) => ({
      ...group,
      cards: group.cards.slice(0, inFrame[group.id] ?? group.cards.length),
    })),
  },
  ui: { ...library.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
