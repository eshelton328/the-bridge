// One artifact in the list beside an open artifact (Figma "artifact row · …",
// D2 403:193): its preview, the title, the source mark and project, and at
// the end the New dot and the age. The open artifact's row is selected.
// On the phone (M1 406:121) the library is a list of these rows: the age
// sits at the end of the title line and New, as the cards' badge, under it.
// With `onOpen` the row is a button. Props only.
import {
  Badge,
  Inline,
  KindMark,
  ListRow,
  MetaLine,
  SparkIcon,
  Stack,
  Thumbnail,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactCard } from '../types.ts'
import { NewDot } from './NewDot.tsx'

// Figma's row preview is 64 × 40 (403:194). No size token is 64 (LIBRARY_GAPS.md: List row thumbnail);
// `control.xl` (44) is the nearest, and the compact thumbnail keeps its 8:5 shape, so it is 27.5 high.
const thumb = css({ w: 'control.xl', alignSelf: 'center' })
const end = css({ alignSelf: 'center' })
// M1: the age over New (406:138, 406:144); one column 4 apart, so with the 20 px badge it is no taller than the title
// and meta, and the row keeps D2's height (LIBRARY_GAPS.md: List row padding and age).
const phoneEnd = css({ alignItems: 'flex-end' })

export type ArtifactRowProps = {
  card: ArtifactCard
  selected?: boolean | undefined
  /** `phone` puts the age on the title line and New under it (M1); `list` (the default) the New dot before the age (D2). */
  layout?: 'list' | 'phone' | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function ArtifactRow({ card, selected = false, layout = 'list', onOpen }: ArtifactRowProps) {
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
          layout === 'phone' ? (
            <Stack gap="4" className={phoneEnd}>
              {card.age}
              {card.isNew ? <Badge label="New" icon={<SparkIcon size="12" />} tone="working" size="sm" /> : null}
            </Stack>
          ) : (
            <Inline gap="12" align="center" className={end}>
              {card.isNew ? <NewDot label="New" /> : null}
              {card.age}
            </Inline>
          )
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
