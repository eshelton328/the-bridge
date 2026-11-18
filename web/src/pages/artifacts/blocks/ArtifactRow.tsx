// One artifact in the list beside an open artifact (Figma "artifact row · …",
// D2 403:193): its preview, the title, the source mark and project, and at
// the end the New dot and the age. The open artifact's row is selected.
// On the phone (M1 406:121) the library is a list of these rows: the age
// sits at the end of the title line and New, as the cards' badge, under it.
// In the phone's search (M5 408:76) a row marks the match in its title, or
// shows the line that matched under the meta line, the match marked.
// With `onOpen` the row is a button. Props only.
import {
  Badge,
  Highlight,
  Inline,
  KindMark,
  ListRow,
  MetaLine,
  SparkFilledIcon,
  Stack,
  Thumbnail,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactCard } from '../types.ts'
import { NewDot } from './NewDot.tsx'

// Figma's row preview is 64 × 40 on the desktop (403:194, `Thumbnail size="sm"`) and 76 × 48 on the phone (406:122,
// `size="md"`), each centred down the row. The phone's drawing is D2's scaled up; Figma draws its own (LIBRARY_GAPS.md:
// Phone row preview drawing).
const thumb = css({ alignSelf: 'center' })
const end = css({ alignSelf: 'center' })
// M1: the age over New (406:138, 406:144), one column 4 apart; New is Figma's 48 × 16 pill with its filled star
// (`Badge size="xs"`, `SparkFilledIcon`).
const phoneEnd = css({ alignItems: 'flex-end' })
// M1 406:121: the phone's rows pad their content 4 at the sides (the preview at 16, the age and New ending at 374),
// against `ListRow`'s 10 inside its 1 px border. The row takes the 6 px difference outside the list's padding, as the
// Inbox's phone rows do (Inbox M1), so its content sits 1 px inside Figma's; the element marked as the Figma row
// keeps the row's 366 px (LIBRARY_GAPS.md: List row padding and age).
const phoneRow = css({ mx: '-6' })

export type ArtifactRowProps = {
  card: ArtifactCard
  selected?: boolean | undefined
  /** `phone` puts the age on the title line and New under it (M1); `list` (the default) the New dot before the age (D2). */
  layout?: 'list' | 'phone' | undefined
  /** The search, whose match is marked in the title or in `matchLine` (M5). */
  query?: string | undefined
  /** Whether the search matched the title (M5 408:92), which then marks it. */
  titleMatch?: boolean | undefined
  /** The line that matched, under the meta line, such as the link (M5 408:358). */
  matchLine?: string | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function ArtifactRow({
  card,
  selected = false,
  layout = 'list',
  query = '',
  titleMatch = false,
  matchLine,
  onOpen,
}: ArtifactRowProps) {
  // A line of its own under the meta line, with the match marked (M5 408:328). Without one the row gets no children,
  // as ListRow draws a line for any children.
  const line =
    matchLine === undefined
      ? {}
      : {
          children: (
            <span>
              <Highlight text={matchLine} query={query} />
            </span>
          ),
        }
  const row = (
    <ListRow
      title={card.title}
      highlight={titleMatch ? query : undefined}
      leading={
        <span className={thumb}>
          <Thumbnail kind={card.preview} size={layout === 'phone' ? 'md' : 'sm'} />
        </span>
      }
      meta={<MetaLine leading={<KindMark kind={card.source} size="12" />} items={[card.project]} />}
      trailing={
        layout === 'phone' ? (
          <Stack gap="4" className={phoneEnd}>
            {card.age}
            {card.isNew ? <Badge label="New" tone="working" size="xs" icon={<SparkFilledIcon size="12" />} /> : null}
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
      {...line}
    />
  )
  return (
    <div data-figma={`artifact row · ${card.title}`}>
      {layout === 'phone' ? <div className={phoneRow}>{row}</div> : row}
    </div>
  )
}
