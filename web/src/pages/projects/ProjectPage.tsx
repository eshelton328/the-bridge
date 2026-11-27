// A project's page (`/projects/<slug>`, R4): the connected entry of the
// project route, which reads the router and stores as ProjectsPage does for
// the home. It keeps what the owner changes (the tab, the More drawer) for the
// shown `?state=`, and Back to Projects opens the home. Quick chat does
// nothing yet (NCC-129's composer).
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { ProjectsScreen } from './screens/ProjectsScreen.tsx'
import type { ProjectsUi } from './types.ts'

const route = getRouteApi('/projects_/$slug')

type Changed = { of: string | undefined; ui: Partial<ProjectsUi> }

export function ProjectPage() {
  const state = route.useLoaderData()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}) }
  const railBadge = useInboxBadge(state.data.railBadge, state.data.live !== undefined)
  return (
    <ProjectsScreen
      settingsEntry
      navPages={navPages}
      data={{ ...state.data, railBadge }}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        const to = navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
      onUiChange={(change) => {
        setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
      }}
      onBack={() => void navigate({ to: '/projects' })}
    />
  )
}
