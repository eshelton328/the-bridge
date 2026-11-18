// The toolkit items a chat used (Figma `items · link to their pages`, D15
// 477:526; `toolkit items` in the open chat, D18 478:484): one library
// `MapNode` each, as the Links tab draws a linked item: the kind's icon, the
// name in mono and "×" and the times when more than once, in the kind's
// border. A tap opens the item's page. Figma's chip is 29 high with a 13 px
// icon; the node is 28 (`control.sm`) with the library's icon
// (LIBRARY_GAPS.md, Activity item chip). Props only.
import { MapNode } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitChatItem } from '../types.ts'
import { chatItemLabel, linkLayer } from './activitySources.ts'

// D15 477:527 to 477:531: the chips 8 apart, the rows of chips 6 apart (477:557 under 477:544).
// As wide as its chips (D18 `toolkit items` 478:484, 176 wide), in the chat's column or the row's actions.
const row = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  alignSelf: 'flex-start',
  columnGap: '8',
  rowGap: '6',
})
// MapNode fills the box it is placed in: as wide as its name, 28 high.
const node = css({ display: 'inline-grid', h: 'control.sm' })

export type ToolkitChatItemsProps = {
  items: readonly ToolkitChatItem[]
  /** Text before the chips on their line, such as when the chat ran. */
  lead?: ReactNode
  /** Opens an item on its page, by its path. */
  onOpen?: ((path: string) => void) | undefined
  /**
   * The Figma key of the row of chips, which also keys each chip (`link · ` and its name); none in the list, where
   * every chat's row and chips have the same names.
   */
  layer?: string | undefined
}

export function ToolkitChatItems({ items, lead, onOpen, layer }: ToolkitChatItemsProps) {
  return (
    <div className={row} data-figma={layer}>
      {lead}
      {items.map((i) => (
        <span key={i.path} className={node} data-figma={layer === undefined ? undefined : linkLayer(i)}>
          <MapNode
            label={chatItemLabel(i)}
            kind={i.kind}
            onClick={() => {
              onOpen?.(i.path)
            }}
          />
        </span>
      ))}
    </div>
  )
}
