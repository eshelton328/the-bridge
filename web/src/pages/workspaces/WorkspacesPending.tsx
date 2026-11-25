// The Workspaces page while its route loads (R58, the loading standard): the page's real layout at once, after the
// router's pendingMs (app/router.ts). On the phone and the tablet the list draws its header with Edit and + off and
// workspaces that load in the groups' place; the desktop draws the sidebar the same way, beside the focused chat's
// skeleton. It reads the nav order and the Inbox badge like the page entry; only More and the nav do anything.
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { workspacesHome } from './home.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import type { WorkspacesUi } from './types.ts'

export function WorkspacesPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  const railBadge = useInboxBadge(0, true)
  // Only the More drawer opens while the page loads: every other control is off.
  const [ui, setUi] = useState<WorkspacesUi>(workspacesHome.ui)
  return (
    <WorkspacesScreen
      settingsEntry
      loading
      navPages={navPages}
      data={{ ...workspacesHome.data, workspaces: [], panes: [], railBadge }}
      ui={ui}
      viewport="desktop"
      onUiChange={(change) => {
        setUi((now) => ({ ...now, ...change }))
      }}
      onNavigate={(page) => {
        // The desktop rail's More goes to Toolkit (d-105), as on the loaded page; the tablet's and the phone's open
        // the drawer in the screen.
        const to = page === 'more' ? '/toolkit' : navRoute(page)
        if (to !== undefined && to !== '/workspaces') void navigate({ to })
      }}
    />
  )
}
