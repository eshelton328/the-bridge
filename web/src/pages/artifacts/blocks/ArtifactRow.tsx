// One artifact in the list beside an open artifact (Figma "artifact row · …",
// D2 403:193): its preview, the title, the source mark and project, the New
// dot at the end of the title line and the age centred down the row. The open
// artifact's row is selected.
// On the phone (M1 406:121) the library is a list of these rows: the age
// sits at the end of the title line and New, as the cards' badge, under it.
// In the phone's search (M5 408:76) a row marks the match in its title, or
// shows the line that matched under the meta line, the match marked; the age
// is alone on the title line and New ends the meta line (408:99).
// With `onOpen` the row is a button. Props only.
import {
  Badge,
  Highlight,
  KindMark,
  ListRow,
  MetaLine,
  SparkFilledIcon,
  Stack,
  Thumbnail,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { ArtifactCard } from '../types.ts'

// Figma's row preview is 64 × 40 on the desktop (403:194, `Thumbnail size="sm"`) and 76 × 48 on the phone (406:122,
// `size="md"`), each centred down the row. Since library beta.71 (PR 221) `md` draws Figma's phone row drawing
// (406:122 to 406:278): a top bar with no window dots and larger shapes.
const thumb = css({ alignSelf: 'center' })
// M1: the age over New (406:138, 406:144), one column 4 apart; New is Figma's 48 × 16 pill with its filled star
// (`Badge size="xs"`, which draws `SparkFilledIcon` at 8 px, library beta.43).
const phoneEnd = css({ alignItems: 'flex-end' })
const newBadge = <Badge label="New" tone="working" size="xs" icon={<SparkFilledIcon />} />

export type ArtifactRowProps = {
  card: ArtifactCard
  selected?: boolean | undefined
  /**
   * `phone` puts the age on the title line and New under it (M1), or at the end of the meta line in a search (M5);
   * `list` (the default) the New dot before the age (D2).
   */
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
  // D2 403:193: rows pad 8 inside their 1 px border, 58 high around the 40 px preview, with the age centred down the
  // row and a new artifact's dot at the end of the title line, 12 before the age (403:213). M1 406:121: the phone's
  // rows pad 4 at the sides (the preview at 16 of a row at 12, the age and New ending at 374) and 10 above and below.
  const list = layout === 'list'
  const dot = list && card.isNew
  // M5 408:76: a phone search row puts the age alone at the end of the title line (408:93, `trailingPlacement="title"`,
  // library beta.47), so the meta line runs on under it to x 374, where New ends it (408:99, `metaTrailing`).
  const phoneSearch = layout === 'phone' && query !== ''
  const metaEnd = phoneSearch && card.isNew ? { metaTrailing: newBadge } : {}
  return (
    <div data-figma={`artifact row · ${card.title}`}>
      <ListRow
        title={card.title}
        highlight={titleMatch ? query : undefined}
        leading={
          <span className={thumb}>
            {/* d-084: a preview that fails to render shows its fallback; the row's text stays. */}
            <BlockBoundary contentKey={card.id}>
              <Thumbnail
                kind={card.preview}
                size={layout === 'phone' ? 'md' : 'sm'}
                {...(card.tone === undefined ? {} : { tone: card.tone })}
              />
            </BlockBoundary>
          </span>
        }
        meta={<MetaLine leading={<KindMark kind={card.source} size="12" />} items={[card.project]} />}
        {...metaEnd}
        trailing={
          layout === 'phone' && !phoneSearch ? (
            <Stack gap="4" className={phoneEnd}>
              {card.age}
              {card.isNew ? newBadge : null}
            </Stack>
          ) : (
            card.age
          )
        }
        padding={list ? 'sm' : 'phone'}
        trailingPlacement={phoneSearch ? 'title' : 'column'}
        trailingAlign={list ? 'center' : 'start'}
        dot={dot ? 'working' : undefined}
        dotLabel={dot ? 'New' : undefined}
        dotPosition="end"
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
    </div>
  )
}
