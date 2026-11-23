// A group of the list beside an open artifact (Figma "group · …", D2
// 403:186): the group header with the count and the New dot, as CardGroup
// draws it, and under it, while the group is open, one row per artifact.
// On the phone (M1 406:114) the library itself is these groups, with no
// row selected, and its search (M5 408:290) is one group of the matches,
// each row marking where it matched. Props only.
import { GroupHeader, Stack } from '@eshelton328/component-library-1701'
import type { ArtifactGroup, MatchPlace } from '../types.ts'
import { ArtifactRow } from './ArtifactRow.tsx'

// D2's rows are 58 high, 2 apart (403:193 to 403:219), a 60 px pitch: `ListRow padding="sm"` pads 8 inside its 1 px
// border, so the rows are Figma's height and sit 2 apart. M1's rows are 66 high, 2 apart (406:121 to 406:148), a 68 px
// pitch: `padding="phone"` pads 8 above and below inside the border (library beta.41, #156), so the phone's rows are
// Figma's 66 around the 48 px preview and sit 2 apart, as on the desktop.

/** A group of rows: a library group, or the search's matches with no count or dot (M5). */
type RowGroupData = Pick<ArtifactGroup, 'label' | 'cards'> & {
  id: string
  count?: number | undefined
  dot?: boolean | undefined
}

/** A search's matches (M5): the query, and by the card's id where it matched and the line that shows the match. */
type RowGroupSearch = {
  query: string
  places: ReadonlyMap<string, MatchPlace>
  /** The line under the meta line (`matchLine` in screens/libraryView.ts); none for a title or project match. */
  lines: ReadonlyMap<string, string>
}

export type RowGroupProps = {
  group: RowGroupData
  /** The Figma layer the header stands for; `group · <LABEL>` when not set. */
  figma?: string | undefined
  /** With a search, each row marks where it matched (M5). */
  search?: RowGroupSearch | undefined
  open: boolean
  /** The open artifact, whose row is selected; the phone's library has none. */
  selectedId?: string | undefined
  /** `phone` draws the phone's rows (M1); `list` (the default) the list beside an open artifact (D2). */
  layout?: 'list' | 'phone' | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
}

export function RowGroup({
  group,
  figma,
  search,
  open,
  selectedId,
  layout = 'list',
  onOpenChange,
  onOpenArtifact,
}: RowGroupProps) {
  const contentId = `artifacts-rows-${group.id}`
  return (
    <Stack gap="2">
      {/* Level 2 under the list's h1, around the toggle, as CardGroup's heading. */}
      <div role="heading" aria-level={2} data-figma={figma ?? `group · ${group.label.toUpperCase()}`} data-fit="group">
        <GroupHeader
          label={group.label}
          count={group.count}
          dot={group.dot === true ? 'working' : undefined}
          open={open}
          onOpenChange={onOpenChange}
          contentId={contentId}
        />
      </div>
      {open ? (
        <Stack gap="2" id={contentId} data-fit="items">
          {group.cards.map((card) => {
            const place = search?.places.get(card.id)
            return (
              <ArtifactRow
                key={card.id}
                card={card}
                selected={card.id === selectedId}
                layout={layout}
                query={search?.query}
                titleMatch={place === 'title'}
                matchLine={search?.lines.get(card.id)}
                onOpen={onOpenArtifact}
              />
            )
          })}
        </Stack>
      ) : null}
    </Stack>
  )
}
