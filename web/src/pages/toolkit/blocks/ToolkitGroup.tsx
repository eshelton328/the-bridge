// One kind's items (Figma `group · SKILLS` and its card rows, D1 425:71):
// the group header with the count, which opens and closes the group, and
// the cards in a grid, four across on the desktop, two on a tablet and one
// on a phone. A tablet shows each item as a card row (T1 428:58), 8 px
// apart; a phone as a list row (M1 429:96), 10 px apart. Props only.
import { GroupHeader, Grid } from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitGroupView } from '../types.ts'
import { ToolkitCard } from './ToolkitCard.tsx'
import { ToolkitRow } from './ToolkitRow.tsx'

// Figma 425:71: the header is as wide as its chevron, label and count, and 31 high. The list variant is 36 high
// (12 above, 8 below); the sidebar variant (8 above, 6 below) is 30, the nearest the library has.
const header = css({ alignSelf: 'flex-start' })

const columns = { desktop: '4', tablet: '2', phone: '1' } as const
// T1 428:58: the rows are 8 apart, across and down; M1 429:96: 10 apart.
const gaps = { desktop: '16', tablet: '8', phone: '10' } as const

export type ToolkitGroupProps = {
  group: ToolkitGroupView
  open: boolean
  onOpenChange: (open: boolean) => void
  layout: Viewport
  /** Names more than one shown card has; those cards get no Figma layer name. */
  sharedNames: ReadonlySet<string>
}

export function ToolkitGroup({ group, open, onOpenChange, layout, sharedNames }: ToolkitGroupProps) {
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
          variant="sidebar"
        />
      </div>
      {open ? (
        <Grid id={contentId} columns={columns[layout]} gap={gaps[layout]}>
          {group.items.map((item) => {
            const figma = sharedNames.has(item.name)
              ? undefined
              : `toolkit ${layout === 'desktop' ? 'card' : 'row'} · ${item.name}`
            return layout === 'phone' ? (
              <ToolkitRow key={item.path} item={item} figma={figma} />
            ) : (
              <ToolkitCard key={item.path} item={item} compact={layout !== 'desktop'} figma={figma} />
            )
          })}
        </Grid>
      ) : null}
    </>
  )
}
