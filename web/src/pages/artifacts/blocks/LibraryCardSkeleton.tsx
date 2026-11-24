// An artifact card that loads (R58): the loaded card's `Card` (LibraryCard.tsx) with `loading`, its preview and meta
// line as skeletons and the badge at the end. The library's ArtifactCardSkeleton always draws a description line, but
// most artifacts have none (the served library on 2026-11-24), so this card draws none: an artifact with a description
// grows by that line when it comes (LIBRARY_GAPS.md, "Artifact card skeleton description"). Props only.
import { Card, Skeleton } from '@eshelton328/component-library-1701'

export function LibraryCardSkeleton() {
  return (
    <Card
      loading
      title=""
      badgePosition="end"
      media={<Skeleton shape="block" ratio="wide" />}
      meta={<Skeleton width="half" />}
    />
  )
}
