// The tablet and phone tab bar of every page: Home and the pages, with the
// needs-you count on Inbox (d-045, d-047: More comes last). The tablet adds
// Artifacts before More; the phone keeps five tabs and opens Artifacts and
// Toolkit from More, and the tablet opens Toolkit from More (d-105). It takes the
// place of the desktop rail (AppRail). Props only; the page entry does the
// navigation.
import {
  ArtifactsIcon,
  HomeIcon,
  InboxIcon,
  MoreIcon,
  ProjectsIcon,
  TabBar,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'

type AppTabPage = 'home' | 'inbox' | 'workspaces' | 'projects' | 'artifacts' | 'more'

export type AppTabBarProps = {
  selected: AppTabPage
  /** The tablet shows an Artifacts tab; the phone does not. */
  device: 'tablet' | 'phone'
  /** The number of Inbox items that need Erik. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
}

export function AppTabBar({ selected, device, inboxBadge, onSelect }: AppTabBarProps) {
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
          ...(device === 'tablet' ? [{ value: 'artifacts', label: 'Artifacts', icon: <ArtifactsIcon /> }] : []),
          { value: 'more', label: 'More', icon: <MoreIcon /> },
        ]}
      />
    </div>
  )
}
