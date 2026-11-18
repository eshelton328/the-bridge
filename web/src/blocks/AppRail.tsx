// The desktop nav rail of every page: the logo and the five pages, with
// the needs-you count on Inbox (d-047: More comes last). Artifacts and
// Toolkit come before More, as the Toolkit page's D1 draws them (d-105).
// Each item carries its Figma layer name (`rail · Inbox`) for the fidelity
// check. Props only; the page entry does the navigation.
import {
  ArtifactsIcon,
  InboxIcon,
  Logo,
  MoreIcon,
  NavRail,
  ProjectsIcon,
  ToolkitIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'

type AppRailPage = 'inbox' | 'workspaces' | 'projects' | 'artifacts' | 'toolkit' | 'more'

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
        { value: 'inbox', label: 'Inbox', figma: 'rail · Inbox', icon: <InboxIcon />, badge: inboxBadge },
        { value: 'workspaces', label: 'Workspaces', figma: 'rail · Workspaces', icon: <WorkspacesIcon /> },
        { value: 'projects', label: 'Projects', figma: 'rail · Projects', icon: <ProjectsIcon /> },
        { value: 'artifacts', label: 'Artifacts', figma: 'rail · Artifacts', icon: <ArtifactsIcon /> },
        { value: 'toolkit', label: 'Toolkit', figma: 'rail · Toolkit', icon: <ToolkitIcon /> },
        { value: 'more', label: 'More', figma: 'rail · More', icon: <MoreIcon /> },
      ]}
    />
  )
}
