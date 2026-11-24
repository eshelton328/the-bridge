// A card group while the library loads (R58, the loading standard): a group header that loads, then cards that load
// in the loaded grid's columns and gaps (cardGrid.ts), from the library's presets, so the cards take the skeleton's
// place with no jump. Props only.
import {
  ArtifactCardSkeleton,
  GroupHeaderSkeleton,
  Grid,
  SkeletonGroup,
  Stack,
} from '@eshelton328/component-library-1701'
import type { Viewport } from '../../../lib/screenState.ts'
import { cardColumns, cardGap, groupGap, tabletCardRows } from './cardGrid.ts'

// Two rows of cards: enough to fill the first screen on each layout.
const cards = { desktop: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], tablet: ['a', 'b', 'c', 'd'], phone: ['a', 'b'] }

export type CardGroupSkeletonProps = {
  layout: Viewport
}

export function CardGroupSkeleton({ layout }: CardGroupSkeletonProps) {
  return (
    <SkeletonGroup label="Loading Artifacts">
      <Stack gap={groupGap(layout)}>
        <div data-fit="group">
          <GroupHeaderSkeleton />
        </div>
        <Grid
          columns={cardColumns[layout]}
          gap={cardGap[layout]}
          className={layout === 'tablet' ? tabletCardRows : undefined}
          data-fit="items"
        >
          {cards[layout].map((id) => (
            <ArtifactCardSkeleton key={id} />
          ))}
        </Grid>
      </Stack>
    </SkeletonGroup>
  )
}
