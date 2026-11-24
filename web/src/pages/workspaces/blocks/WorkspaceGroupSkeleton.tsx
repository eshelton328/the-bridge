// The workspaces while the page waits for its first list (R58, the loading standard): workspaces that load, each a
// group header and chat rows from the library's presets, with the real list's gaps, so the loaded groups take their
// place with no jump. The rows are the library's sidebar `ListRow` recipe, as the loaded rows are, so a change to that
// recipe moves both. Props only.
import { ChatRowSkeleton, GroupHeaderSkeleton, SkeletonGroup, Stack } from '@eshelton328/component-library-1701'

// Three workspaces of three, two and two chats: enough to fill a phone's first screen.
const groups = [
  { id: 'a', rows: ['a1', 'a2', 'a3'] },
  { id: 'b', rows: ['b1', 'b2'] },
  { id: 'c', rows: ['c1', 'c2'] },
]

export function WorkspaceGroupSkeleton() {
  return (
    <SkeletonGroup label="Loading Workspaces">
      <Stack gap="4">
        {groups.map((group, i) => (
          <div key={group.id}>
            <div data-fit={i === 0 ? 'group' : undefined}>
              <GroupHeaderSkeleton variant="sidebar" />
            </div>
            <Stack gap="4" data-fit={i === 0 ? 'items' : undefined}>
              {group.rows.map((row) => (
                <ChatRowSkeleton key={row} />
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    </SkeletonGroup>
  )
}
