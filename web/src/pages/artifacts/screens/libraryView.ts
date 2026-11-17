// What the library shows for a state and what Erik changed: the groups,
// each with the cards that pass the source chip and the search. A chip's
// and a group's count stay the state's: the library holds more artifacts
// than the cards the mock data draws. Pure; tested in libraryView.test.ts.
import type { ArtifactCard, ArtifactFilter, ArtifactGroup, ArtifactsData, ArtifactsUi } from '../types.ts'

const passes = (card: ArtifactCard, filter: ArtifactFilter) =>
  filter === 'all' ? true : filter === 'new' ? card.isNew : card.source === filter

const matches = (card: ArtifactCard, query: string) => {
  const q = query.trim().toLowerCase()
  return q === '' || [card.title, card.description, card.project].some((text) => text.toLowerCase().includes(q))
}

/** The groups to draw: each group's cards that pass the chip and the search; a group with none left is left out. */
export function libraryView(data: ArtifactsData, ui: ArtifactsUi): ArtifactGroup[] {
  return data.groups
    .map((group) => ({ ...group, cards: group.cards.filter((c) => passes(c, ui.filter) && matches(c, ui.query)) }))
    .filter((group) => group.cards.length > 0)
}
