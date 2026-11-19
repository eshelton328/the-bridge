// Figma Artifacts M5 "M5 · Search": on the phone, "eval" in the search with
// the keyboard open. The library gives way to one group of the matches, and
// each row marks its match: in the title, or in the line that matched under
// its meta line (part of the description, or the link). Copy word for word
// from references/artifacts/M05/frame.json. It is M1's library with D4's
// search: the chips count the matches, the readme cold-reader run has its
// D4 description and Earlier gains the Writer cross-family round, whose
// link holds the match. The keyboard is the phone's own (d-089); the app
// draws none, and Figma keeps the tab bar under it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactCard, ArtifactsData, ArtifactsUi } from '../types.ts'
import { libraryPhone } from './libraryPhone.ts'
import { searchList } from './searchList.ts'

/** 408:330: M5 draws each match's preview as a chart. */
const chart: ArtifactCard['preview'] = 'chart'

export const searchPhone = {
  title: 'A search on a phone, each match with the line that matched',
  frames: [{ id: 'M5', node: '408:2', viewport: 'phone' }],
  data: {
    ...libraryPhone.data,
    chips: searchList.data.chips,
    // The Writer round's preview is a chart in M5 (408:330), a doc in D4 (403:8280).
    groups: searchList.data.groups.map((group) => ({
      ...group,
      cards: group.cards.map((card) => (card.id === 'writer-cross-family-x1' ? { ...card, preview: chart } : card)),
    })),
    search: {
      ...searchList.data.search,
      // 408:50: the keyboard's search key (408:415) is named "search" too.
      fieldLayer: '408:50',
      // 408:328: the words around the match in the readme cold-reader run's description.
      excerpts: { 'readme-cold-reader-run': '…the cold-reader eval of the readme skill…' },
    },
  },
  // Figma draws the search focused, with its cyan border (408:50).
  ui: { ...libraryPhone.ui, query: 'eval', searchFocus: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
