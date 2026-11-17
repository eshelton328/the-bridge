// One artifact in the list beside an open artifact (Figma "artifact row · …",
// D2 403:193): its preview, the title, the source mark and project, and at
// the end the New dot and the age. The open artifact's row is selected.
// With `onOpen` the row is a button. Props only.
import { Inline, KindMark, ListRow, MetaLine, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactCard } from '../types.ts'

// Figma's row preview is 64 × 40 (403:194). No size token is 64 (LIBRARY_GAPS.md: List row thumbnail);
// `control.xl` (44) is the nearest, and the compact thumbnail keeps its 8:5 shape, so it is 27.5 high.
const thumb = css({ w: 'control.xl', alignSelf: 'center' })
// The New dot (403:213): the library has no dot for a row (LIBRARY_GAPS.md: New dot in a list row); it is
// drawn 6 px round in `status.working.fg`, as GroupHeader's dot: no size token is 6, so a 2 px padding inside a
// 1 px border of the same colour makes it.
const dot = css({
  flexShrink: '0',
  p: '2',
  borderRadius: 'full',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'status.working.fg',
  bg: 'status.working.fg',
})
const end = css({ alignSelf: 'center' })

export type ArtifactRowProps = {
  card: ArtifactCard
  selected: boolean
  onOpen?: ((id: string) => void) | undefined
}

export function ArtifactRow({ card, selected, onOpen }: ArtifactRowProps) {
  return (
    <div data-figma={`artifact row · ${card.title}`}>
      <ListRow
        title={card.title}
        leading={
          <span className={thumb}>
            <Thumbnail kind={card.preview} shape="compact" />
          </span>
        }
        meta={<MetaLine leading={<KindMark kind={card.source} size="12" />} items={[card.project]} />}
        trailing={
          <Inline gap="12" align="center" className={end}>
            {card.isNew ? <span className={dot} role="img" aria-label="New" /> : null}
            {card.age}
          </Inline>
        }
        selected={selected}
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
