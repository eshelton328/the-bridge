// Figma Artifacts T1 "T1 · Library": the library on the iPad mini, the same
// grid as D1 in two columns, over the tab bar with Artifacts selected after
// Projects. Copy word for word from references/artifacts/T01/frame.json. It
// starts from the D1 library and differs from it in three strings: the
// search says "Search artifacts", and two Earlier descriptions are shorter
// (405:279, 405:303). Earlier shows the two cards the frame draws (405:263);
// its later cards lie below the frame, so they wait for a frame that shows them.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

/** T1's descriptions (405:279, 405:303) by card id; the other cards keep D1's. */
const descriptions: Record<string, string> = {
  'the-bridge-theme-ideas': 'Viewscreen, Captain’s Log, Engineering and Console',
  'application-versioning': 'Research report: versioning, changelogs and release automation',
}

/** How many of a group's cards the frame draws: Earlier's first two (405:264, 405:286); Found keeps its four. */
const inFrame: Record<string, number> = { earlier: 2 }

export const libraryTablet = {
  title: 'The library on a tablet, in two columns',
  frames: [{ id: 'T1', node: '405:2', viewport: 'tablet' }],
  data: {
    ...library.data,
    searchPlaceholder: 'Search artifacts',
    groups: library.data.groups.map((group) => ({
      ...group,
      cards: group.cards
        .slice(0, inFrame[group.id] ?? group.cards.length)
        .map((card) => ({ ...card, description: descriptions[card.id] ?? card.description })),
    })),
  },
  ui: { ...library.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
