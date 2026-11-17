// The library's list view (Figma D4 403:8208 to 403:8308): with a search,
// one group of the matches, each row saying where it matched, and the hint
// under it; without one, each group's artifacts as rows. The rows come from
// libraryView, as the grid's cards do. Props only; changes go out through
// onUiChange.
import { css } from '../../../../styled-system/css/index.js'
import { LibraryRow } from '../blocks/LibraryRow.tsx'
import { ListGroup } from '../blocks/ListGroup.tsx'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { libraryView, searchMatches } from './libraryView.ts'

// 403:8308: the hint under the results, in the small muted text, as wide as its text.
const hint = css({ alignSelf: 'flex-start', textStyle: 'small', color: 'fg.muted' })

export type LibraryRowsProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
}

export function LibraryRows({ data, ui, onUiChange, onOpenArtifact }: LibraryRowsProps) {
  const query = ui.query.trim()
  if (query === '')
    return libraryView(data, ui).map((group) => (
      <ListGroup
        key={group.id}
        id={`artifacts-list-${group.id}`}
        label={group.label}
        figma={`group · ${group.label.toUpperCase()}`}
        count={group.count}
        dot={group.dot}
        open={ui.groupsOpen[group.id]}
        onOpenChange={(open) => {
          onUiChange?.({ groupsOpen: { ...ui.groupsOpen, [group.id]: open } })
        }}
      >
        {group.cards.map((card) => (
          <LibraryRow key={card.id} card={card} query="" onOpen={onOpenArtifact} />
        ))}
      </ListGroup>
    ))
  const matches = searchMatches(data, ui)
  return (
    <>
      <ListGroup
        id="artifacts-list-matches"
        label={`${String(matches.length)} ${matches.length === 1 ? 'match' : 'matches'} for “${query}”`}
        figma="group · matches"
        rowsFigma="result list"
        open={ui.matchesOpen ?? true}
        onOpenChange={(matchesOpen) => {
          onUiChange?.({ matchesOpen })
        }}
      >
        {matches.map(({ card, place }) => (
          <LibraryRow
            key={card.id}
            card={card}
            query={query}
            place={place}
            placeLabel={data.search?.places[place]}
            onOpen={onOpenArtifact}
          />
        ))}
      </ListGroup>
      {data.search === undefined ? null : (
        <p className={hint} data-figma="hint">
          {data.search.hint}
        </p>
      )}
    </>
  )
}
