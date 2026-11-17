// The tablet and phone tab bar of every page: Home and the four pages, with
// the needs-you count on Inbox (d-045, d-047: More comes last). It takes the
// place of the desktop rail (AppRail). Props only; the page entry does the
// navigation.
import {
  HomeIcon,
  InboxIcon,
  MoreIcon,
  ProjectsIcon,
  TabBar,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'

type AppTabPage = 'home' | 'inbox' | 'workspaces' | 'projects' | 'more'

export type AppTabBarProps = {
  selected: AppTabPage
  /** The number of Inbox items that need Erik. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
}

export function AppTabBar({ selected, inboxBadge, onSelect }: AppTabBarProps) {
  return (
    <div data-figma="tab bar">
      <TabBar
        selected={selected}
        onSelect={onSelect}
        items={[
          { value: 'home', label: 'Home', icon: <HomeIcon /> },
          { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: inboxBadge },
          { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
          { value: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
          { value: 'more', label: 'More', icon: <MoreIcon /> },
        ]}
      />
    </div>
  )
}
