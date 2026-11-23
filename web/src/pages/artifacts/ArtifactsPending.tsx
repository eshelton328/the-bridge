// The Artifacts page while its route loads (the loading standard): the app's shell at once, with skeletons in the
// page's place, after the router's pendingMs (app/router.ts). It reads the nav order like the page entry.
import { useNavigate } from '@tanstack/react-router'
import { LoadingShell } from '../../blocks/LoadingShell.tsx'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'

export function ArtifactsPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  return (
    <LoadingShell
      selected="artifacts"
      label="Loading Artifacts"
      navPages={navPages}
      settings
      viewport="desktop"
      onNavigate={(page) => {
        // The desktop rail's More goes to Toolkit (d-105), as on the loaded page.
        const to = page === 'more' ? '/toolkit' : navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
    />
  )
}
