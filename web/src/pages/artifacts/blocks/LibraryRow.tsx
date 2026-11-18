// One artifact in the library's list view (Figma "artifact row · …", D4
// 403:8216): its preview, the title, the description and the meta line
// (source, project and, for a match in it, the link), and at the end the
// New dot, where a search matched it, the age and Open. A search marks the
// match in the field it names. Props only.
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
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactCard, MatchPlace } from '../types.ts'
import { NewDot } from './NewDot.tsx'

// Figma draws each row in a box with a 1 px border on the pane fill (403:8216). `ListRow` has no border; the box
// takes the Card's border, radius and fill, and `ListRow`'s own 10 px padding and clear border put the content 12 in.
const box = css({
  bg: 'surface.pane',
  borderRadius: 'lg',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})

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
    <div className={box} data-figma={`artifact row · ${card.title}`}>
      <ListRow
        title={card.title}
        highlight={place === 'title' ? query : undefined}
        // Figma's preview is 128 × 72 (403:8217): the card's drawing at 16:9.
        leading={<Thumbnail kind={card.preview} size="lg" shape="wide" />}
        trailing={
          <Inline gap="16" align="center">
            {card.isNew ? <NewDot label="New" /> : null}
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
