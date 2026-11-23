// The phone's library while it loads (R58, the loading standard): a group header that loads, then rows that load,
// 2 apart as RowGroup's rows, so the rows take the skeleton's place with no jump. Each row is the library's ListRow in
// its loading form with the phone's padding and 76 × 48 preview, as ArtifactRow draws a phone row: the library's
// ArtifactRowSkeleton takes the default padding, 4 px taller (LIBRARY_GAPS.md: Artifact row skeleton padding). Props
// only.
import { GroupHeaderSkeleton, ListRow, Skeleton, SkeletonGroup, Stack } from '@eshelton328/component-library-1701'

// Eight rows: more than the phone's first screen holds.
const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export function RowGroupSkeleton() {
  return (
    <SkeletonGroup label="Loading Artifacts">
      <Stack gap="2">
        <div data-fit="group">
          <GroupHeaderSkeleton />
        </div>
        <Stack gap="2" data-fit="items">
          {rows.map((id) => (
            <ListRow
              key={id}
              loading
              title=""
              padding="phone"
              leading={<Skeleton shape="block" size="thumbnailMd" />}
              meta={<Skeleton width="half" />}
            />
          ))}
        </Stack>
      </Stack>
    </SkeletonGroup>
  )
}
