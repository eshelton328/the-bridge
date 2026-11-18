// One toolkit item as a list row: on the phone (Figma `toolkit row · <name>`,
// M1 429:96) the kind tile, the name over its path, and at the end the two
// link counts (→ the files it links to, ← the files that link to it) and a
// chevron, with no surface or border. In the list beside an open item (D3
// 427:94) the row has the small tile and no chevron, and the open item's row
// is selected (427:166). With `onSelect` a click opens the item. Props only.
import { ChevronRightIcon, KindTile, ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemView } from '../types.ts'

// M1 429:104: the counts in the path's grey, then the chevron, in one line at the row's end. Figma's chevron
// (429:105) is 14 px, 12 after the counts; no icon token has 14, and with 16 the longest path
// (agents/pr-description-checker.md, 429:243) wraps, so the chevron is 12, 6 after the counts.
const end = css({ display: 'inline-flex', alignItems: 'center', gap: '6', color: 'fg.muted', whiteSpace: 'nowrap' })

export type ToolkitRowProps = {
  item: ToolkitItemView
  /** The Figma layer the row stands for; none when two shown items share a name. */
  figma?: string | undefined
  /** `phone` (M1, the default): the large tile and a chevron; `pane` (D3): the small tile and no chevron. */
  size?: 'phone' | 'pane' | undefined
  /** The open item's row. */
  selected?: boolean | undefined
  /** Called when the row is clicked; the row is not a button without it. */
  onSelect?: (() => void) | undefined
}

export function ToolkitRow({ item, figma, size = 'phone', selected, onSelect }: ToolkitRowProps) {
  const phone = size === 'phone'
  return (
    <div data-figma={figma}>
      <ListRow
        title={item.name}
        leading={<KindTile kind={item.kind} size={phone ? 'lg' : 'sm'} />}
        meta={item.path}
        selected={selected}
        onSelect={onSelect}
        // M1 429:96: 4 in at the sides and 8 above and below, the body 12 after the tile, and the counts and chevron
        // centred down the row. The pane's row (D3) keeps the default inset, gap and placement.
        padding={phone ? 'phone' : undefined}
        trailingAlign={phone ? 'center' : undefined}
        leadingGap={phone ? '12' : undefined}
        trailing={
          <span className={end}>
            {`→${String(item.linksTo)} ←${String(item.linkedFrom)}`}
            {phone ? <ChevronRightIcon size="12" /> : null}
          </span>
        }
      />
    </div>
  )
}
