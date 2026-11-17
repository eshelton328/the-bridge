// The desktop nav rail of every page: the logo and the four pages, with
// the needs-you count on Inbox (d-047: More comes last). Props only; the
// page entry does the navigation.
import { InboxIcon, Logo, MoreIcon, NavRail, ProjectsIcon, WorkspacesIcon } from '@eshelton328/component-library-1701'

type AppRailPage = 'inbox' | 'workspaces' | 'projects' | 'more'

export type AppRailProps = {
  selected: AppRailPage
  /** The number of Inbox items that need Erik. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
}

export function AppRail({ selected, inboxBadge, onSelect }: AppRailProps) {
  return (
    <NavRail
      selected={selected}
      onSelect={onSelect}
      logo={
        <a href="/" aria-label="Home">
          <Logo size="28" />
        </a>
      }
      items={[
        { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: inboxBadge },
        { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
        { value: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
        { value: 'more', label: 'More', icon: <MoreIcon /> },
      ]}
    />
  )
}
