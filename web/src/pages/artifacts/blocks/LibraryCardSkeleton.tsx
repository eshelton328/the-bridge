// An artifact card that loads (R58): the loaded card's `Card` (LibraryCard.tsx) with `loading`, its preview and meta
// line as skeletons and the badge at the end. It keeps the loaded card's two empty description lines
// (`descriptionLines={2}`, R77), so it has the height of every loaded card, with a description or without, and
// nothing jumps when the library comes (LibraryCardHeight.test.tsx). Props only.
import { Card, Skeleton } from '@eshelton328/component-library-1701'

export function LibraryCardSkeleton() {
  return (
    <Card
      loading
      title=""
      badgePosition="end"
      descriptionLines={2}
      media={<Skeleton shape="block" ratio="wide" />}
      meta={<Skeleton width="half" />}
    />
  )
}
