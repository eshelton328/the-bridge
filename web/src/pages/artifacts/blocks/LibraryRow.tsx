// One artifact in the library's list view (Figma "artifact row · …", D4
// 403:8216): its preview, the title, the description and the meta line
// (source, project and, for a match in it, the link), the New dot 8 after
// the title, and at the end where a search matched it, the age and Open,
// centred down the row. A search marks the match in the field it names.
// Props only.
import {
  Badge,
  Button,
  ExternalLinkIcon,
  Highlight,
  Inline,
  KindMark,
  ListRow,
  MetaLine,
  Thumbnail,
} from '@eshelton328/component-library-1701'
import type { ArtifactCard, MatchPlace } from '../types.ts'

export type LibraryRowProps = {
  card: ArtifactCard
  /** The search; its matches are marked in the field `place` names. */
  query: string
  /** Where the search matched the card; without it the row shows no match. */
  place?: MatchPlace | undefined
  /** What the row says about the place, such as "in title". */
  placeLabel?: string | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function LibraryRow({ card, query, place, placeLabel, onOpen }: LibraryRowProps) {
  const mark = (at: MatchPlace, text: string) => (place === at ? <Highlight text={text} query={query} /> : text)
  return (
    <div data-figma={`artifact row · ${card.title}`}>
      {/* Figma draws each row as a card on the pane fill in a 1 px border, padded 12 (403:8216), 98 high around the
      72 px preview, with a new artifact's dot 8 after the title (403:8233). */}
      <ListRow
        title={card.title}
        surface="card"
        padding="lg"
        trailingAlign="center"
        dot={card.isNew ? 'working' : undefined}
        dotLabel={card.isNew ? 'New' : undefined}
        highlight={place === 'title' ? query : undefined}
        // Figma's preview is 128 × 72 (403:8217): the card's drawing at 16:9.
        leading={<Thumbnail kind={card.preview} size="lg" shape="wide" />}
        trailing={
          <Inline gap="16" align="center">
            {placeLabel === undefined ? null : <Badge variant="tag" label={placeLabel} />}
            {card.age}
            <Button
              iconOnly
              aria-label={`Open ${card.title}`}
              onClick={
                onOpen === undefined
                  ? undefined
                  : () => {
                      onOpen(card.id)
                    }
              }
            >
              <ExternalLinkIcon />
            </Button>
          </Inline>
        }
      >
        <span>{mark('description', card.description)}</span>
        <MetaLine
          leading={<KindMark kind={card.source} size="12" />}
          items={[
            card.sourceLabel,
            mark('project', card.project),
            place === 'link' && card.link !== undefined ? mark('link', card.link) : null,
          ]}
        />
      </ListRow>
    </div>
  )
}
