// A group of the library (Figma "group · …" and its "card row"): the group
// header with the count and, for what was found since Erik last looked, the
// New dot; under it, while the group is open, its cards in a grid of four
// columns on the desktop and two on a tablet (T1), where a card names its
// source by its mark alone. Props only.
import { GroupHeader, Grid, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactGroup } from '../types.ts'
import { LibraryCard } from './LibraryCard.tsx'

const columns = { desktop: '4', tablet: '2', phone: '1' } as const
// T1 (405:159 to 405:166, 405:166 to 405:229): the header and the card rows 10 apart; the columns keep 16 (Figma 14, d-100).
const tabletRows = css({ rowGap: '10' })

export type CardGroupProps = {
  group: ArtifactGroup
  open: boolean
  layout: Viewport
  onOpenChange?: ((open: boolean) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
}

export function CardGroup({ group, open, layout, onOpenChange, onOpenArtifact }: CardGroupProps) {
  const contentId = `artifacts-group-${group.id}`
  return (
    <Stack gap={layout === 'tablet' ? '10' : '12'}>
      {/* The group's heading, level 2 between the page's h1 and the cards' h3, around its toggle, as an accordion's. */}
      <div role="heading" aria-level={2} data-figma={`group · ${group.label.toUpperCase()}`}>
        <GroupHeader
          label={group.label}
          count={group.count}
          dot={group.dot ? 'working' : undefined}
          open={open}
          onOpenChange={onOpenChange}
          contentId={contentId}
        />
      </div>
      {open ? (
        <Grid
          id={contentId}
          columns={columns[layout]}
          gap="16"
          className={layout === 'tablet' ? tabletRows : undefined}
        >
          {group.cards.map((card) => (
            <LibraryCard key={card.id} card={card} showSource={layout === 'desktop'} onOpen={onOpenArtifact} />
          ))}
        </Grid>
      ) : null}
    </Stack>
  )
}
