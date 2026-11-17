// What the library shows for a state and what Erik changed: the groups,
// each with the cards that pass the source chip and the search, and for the
// list view's search (D4) each match with where it is. A chip's and a
// group's count stay the state's: the library holds more artifacts than the
// cards the mock data draws. The sort (D6) orders the cards inside each
// group; the groups keep their order, so what the library found since Erik
// last looked stays at the top. Pure; tested in libraryView.test.ts.
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

const byTitle = (a: ArtifactCard, b: ArtifactCard) => a.title.localeCompare(b.title, 'en')

/**
 * The cards in the order of `sort`. A state lists each group's cards newest first, so `newest` keeps that order,
 * `oldest` turns it round, `title` goes A to Z and `project` groups them by project, each project newest first. An
 * unknown sort keeps the state's order.
 */
function sortCards(cards: readonly ArtifactCard[], sort: string): ArtifactCard[] {
  if (sort === 'oldest') return cards.toReversed()
  if (sort === 'title') return cards.toSorted(byTitle)
  if (sort === 'project') return cards.toSorted((a, b) => a.project.localeCompare(b.project, 'en'))
  return [...cards]
}

/**
 * The groups to draw, in the state's order: each group's cards that pass the chip and the search, in the order of
 * the sort; a group with none left is left out.
 */
export function libraryView(data: ArtifactsData, ui: ArtifactsUi): ArtifactGroup[] {
  return data.groups
    .map((group) => ({
      ...group,
      cards: sortCards(
        group.cards.filter((c) => passes(c, ui.filter) && matches(c, ui.query)),
        ui.sort,
      ),
    }))
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
