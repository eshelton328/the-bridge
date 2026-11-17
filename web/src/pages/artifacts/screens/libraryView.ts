// What the library shows for a state and what Erik changed: the groups,
// each with the cards that pass the source chip and the search, and for the
// list view's search (D4) each match with where it is. A chip's and a
// group's count stay the state's: the library holds more artifacts than the
// cards the mock data draws. Pure; tested in libraryView.test.ts.
import type { ArtifactCard, ArtifactFilter, ArtifactGroup, ArtifactsData, ArtifactsUi, MatchPlace } from '../types.ts'

const passes = (card: ArtifactCard, filter: ArtifactFilter) =>
  filter === 'all' ? true : filter === 'new' ? card.isNew : card.source === filter

/** The places search reads, in the order a match names the first one (D4: title, description, link, project). */
const places = (card: ArtifactCard): [MatchPlace, string][] => [
  ['title', card.title],
  ['description', card.description],
  ['link', card.link ?? ''],
  ['project', card.project],
]

/** Where `query` first matches the card, in any case; undefined when it does not, or the query is blank. */
export function matchPlace(card: ArtifactCard, query: string): MatchPlace | undefined {
  const q = query.trim().toLowerCase()
  if (q === '') return undefined
  return places(card).find(([, text]) => text.toLowerCase().includes(q))?.[0]
}

const matches = (card: ArtifactCard, query: string) => query.trim() === '' || matchPlace(card, query) !== undefined

/** The groups to draw: each group's cards that pass the chip and the search; a group with none left is left out. */
export function libraryView(data: ArtifactsData, ui: ArtifactsUi): ArtifactGroup[] {
  return data.groups
    .map((group) => ({ ...group, cards: group.cards.filter((c) => passes(c, ui.filter) && matches(c, ui.query)) }))
    .filter((group) => group.cards.length > 0)
}

export type SearchMatch = { card: ArtifactCard; place: MatchPlace }

/** The search's matches in the list view (D4): every card that passes the chip and matches, in group order. */
export function searchMatches(data: ArtifactsData, ui: ArtifactsUi): SearchMatch[] {
  return libraryView(data, ui).flatMap((group) =>
    group.cards.flatMap((card) => {
      const place = matchPlace(card, ui.query)
      return place === undefined ? [] : [{ card, place }]
    }),
  )
}
