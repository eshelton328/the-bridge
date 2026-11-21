// The desktop nav rail of every page: the logo and the five pages, with
// the needs-you count on Inbox (d-047: More comes last). Artifacts and
// Toolkit come before More, as the Toolkit page's D1 draws them (d-105).
// Each item carries its Figma layer name (`rail · Inbox`) for the fidelity
// check. With `push`, the Notifications switch sits at the rail's end
// (d-118; Figma has none, so each desktop frame records it as a deviation).
// Props only; the page entry does the navigation.
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
import type { PushSwitch } from '../lib/pushSwitch.ts'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

type AppRailPage = 'inbox' | 'workspaces' | 'projects' | 'artifacts' | 'toolkit' | 'more'

export type AppRailProps = {
  selected: AppRailPage
  /** The number of Inbox items that need the owner. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
  /** The Notifications switch (d-118); the rail has none when not set, as in the Figma states. */
  push?: PushSwitch | undefined
}

export function AppRail({ selected, inboxBadge, onSelect, push }: AppRailProps) {
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
      footer={push === undefined ? undefined : <NotificationsSwitch push={push} layout="stacked" />}
    />
  )
}
