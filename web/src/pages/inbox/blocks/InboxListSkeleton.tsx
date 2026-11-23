// The Inbox list while it loads (the loading standard, 2026-11-23): two groups of rows in their loading shape,
// a group header and Inbox rows from the library's presets, each the height of the part it stands for, in a
// status that says the Inbox loads. Props only.
import { GroupHeaderSkeleton, InboxRowSkeleton, SkeletonGroup, Stack } from '@eshelton328/component-library-1701'

/** The rows each loading group draws: three in the first, as Needs you, and two in the next. */
const groups = [
  { id: 'first', rows: ['a', 'b', 'c'] },
  { id: 'next', rows: ['a', 'b'] },
] as const

export function InboxListSkeleton({ phone }: { phone: boolean }) {
  return (
    <SkeletonGroup label="Loading the Inbox">
      <Stack gap="2">
        {groups.map((group) => (
          <Stack key={group.id} gap="2">
            <GroupHeaderSkeleton />
            {group.rows.map((row) => (
              <InboxRowSkeleton key={row} phone={phone} />
            ))}
          </Stack>
        ))}
      </Stack>
    </SkeletonGroup>
  )
}
