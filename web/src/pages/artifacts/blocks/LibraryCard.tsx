// One artifact in the grid (Figma "artifact card · …", 402:15434): its
// preview, the title with New when the library found it since Erik last
// looked, one line of description and the meta line (source mark, source,
// project and age). With `onOpen` the card is a button. Props only.
import { Badge, Card, KindMark, MetaLine, SparkIcon, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactCard } from '../types.ts'

// The meta line takes the card's width, so the age sits at its end (402:15467).
const metaWide = css({ flex: '1', overflow: 'hidden' })
// The mark alone is aria-hidden, so a card that hides the source's name
// still gives it to a screen reader.
const srOnly = css({ srOnly: true })

export type LibraryCardProps = {
  card: ArtifactCard
  /** The source's name after its mark; a tablet card shows the mark alone (T1 405:192). */
  showSource?: boolean | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function LibraryCard({ card, showSource = true, onOpen }: LibraryCardProps) {
  return (
    <div data-figma={`artifact card · ${card.title}`}>
      <Card
        title={card.title}
        media={<Thumbnail kind={card.preview} framed={false} />}
        badge={card.isNew ? <Badge label="New" icon={<SparkIcon size="12" />} tone="working" size="sm" /> : undefined}
        description={card.description}
        meta={
          <div className={metaWide}>
            <MetaLine
              icon="md"
              leading={
                <>
                  <KindMark kind={card.source} size="12" />
                  {showSource ? null : <span className={srOnly}>{card.sourceLabel}</span>}
                </>
              }
              items={showSource ? [card.sourceLabel, card.project] : [card.project]}
              trailing={card.age}
            />
          </div>
        }
        onSelect={
          onOpen === undefined
            ? undefined
            : () => {
                onOpen(card.id)
              }
        }
      />
    </div>
  )
}
