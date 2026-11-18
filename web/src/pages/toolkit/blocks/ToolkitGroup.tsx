// One kind's items (Figma `group · SKILLS` and its card rows, D1 425:71):
// the group header with the count, which opens and closes the group, and
// the cards in a grid, four across on the desktop, two on a tablet and one
// on a phone. A tablet shows each item as a card row (T1 428:58), 8 px
// apart; a phone as a list row (M1 429:96), 10 px apart. Beside an open item
// (`pane`, D3 427:94) the rows are one column, 10 px apart, and the open
// item's row is selected. A click on a card or row opens its item. Props only.
import { GroupHeader, Grid } from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitGroupView } from '../types.ts'
import { ToolkitCard } from './ToolkitCard.tsx'
import { ToolkitRow } from './ToolkitRow.tsx'

// Figma 425:71: the header is as wide as its chevron, label and count. On the desktop it is 31 high, the label 10
// under its top: `toolkit` is 32 high. On a tablet (T1 428:53) it is 27 high, the label 8 under its top:
// `toolkitCompact` is 28. The phone's (M1 429:91) is 23 high with no label offset in the library, and the pane
// (D3) keeps the sidebar variant (8 above, 6 below, 30 high).
const header = css({ alignSelf: 'flex-start' })
const variants = { desktop: 'toolkit', tablet: 'toolkitCompact', phone: 'sidebar', pane: 'sidebar' } as const

const columns = { desktop: '4', tablet: '2', phone: '1', pane: '1' } as const
// T1 428:58: the rows are 8 apart, across and down; M1 429:96 and D3 427:94: 10 apart.
const gaps = { desktop: '16', tablet: '8', phone: '10', pane: '10' } as const

/** The list beside an open item (D3) lays its groups out as one column of rows, as the phone does. */
type ToolkitGroupLayout = Viewport | 'pane'

export type ToolkitGroupProps = {
  group: ToolkitGroupView
  open: boolean
  onOpenChange: (open: boolean) => void
  layout: ToolkitGroupLayout
  /** The path of the open item; its row is selected. */
  selected?: string | null | undefined
  /** Called with an item's path when its card or row is clicked. */
  onOpen?: ((path: string) => void) | undefined
  /** Names more than one shown card has; those cards get no Figma layer name. */
  sharedNames: ReadonlySet<string>
}

export function ToolkitGroup({ group, open, onOpenChange, layout, selected, onOpen, sharedNames }: ToolkitGroupProps) {
  const contentId = useId()
  return (
    <>
      {/* The group is a level 2 heading between the page title and the cards' titles (h3). */}
      <div role="heading" aria-level={2} className={header} data-figma={`group · ${group.label.toUpperCase()}`}>
        <GroupHeader
          label={group.label}
          count={group.items.length}
          open={open}
          onOpenChange={onOpenChange}
          contentId={contentId}
          variant={variants[layout]}
        />
      </div>
      {open ? (
        <Grid id={contentId} columns={columns[layout]} gap={gaps[layout]}>
          {group.items.map((item) => {
            const figma = sharedNames.has(item.name)
              ? undefined
              : `toolkit ${layout === 'desktop' ? 'card' : 'row'} · ${item.name}`
            const select =
              onOpen === undefined
                ? undefined
                : () => {
                    onOpen(item.path)
                  }
            return layout === 'phone' || layout === 'pane' ? (
              <ToolkitRow
                key={item.path}
                item={item}
                figma={figma}
                size={layout}
                selected={item.path === selected}
                onSelect={select}
              />
            ) : (
              <ToolkitCard key={item.path} item={item} compact={layout !== 'desktop'} figma={figma} onSelect={select} />
            )
          })}
        </Grid>
      ) : null}
    </>
  )
}
