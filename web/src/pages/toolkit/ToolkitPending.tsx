// The Toolkit page while its route loads (R58, the loading standard: the page's real layout, so nothing moves when it
// loads). The Toolkit reads no server: its home is local data (home.ts), so the pending page is that home itself, the
// list laid out for the window, with the live Inbox badge as the page entry has in development. It reads the nav order
// like the page entry, and the owner's changes stay in it until the route loads.
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { toolkitHome } from './home.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import type { ToolkitUi } from './types.ts'

export function ToolkitPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  const railBadge = useInboxBadge(toolkitHome.data.railBadge, import.meta.env.DEV)
  const [ui, setUi] = useState<ToolkitUi>(toolkitHome.ui)
  return (
    <ToolkitScreen
      settingsEntry
      navPages={navPages}
      data={{ ...toolkitHome.data, railBadge }}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        // The desktop rail's More goes to Toolkit (d-105), as on the loaded page.
        const to = page === 'more' ? '/toolkit' : navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
      onUiChange={(change) => {
        setUi((now) => ({ ...now, ...change }))
      }}
    />
  )
}
