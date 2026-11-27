// The Projects page's connected entry: the only component of the page that
// reads the router and stores. It keeps what the owner changes (the open ⋯
// menu, the More drawer) for the shown `?state=` and passes everything to the
// props-only screen. The page shows its fixtures; a pin changes nothing yet.
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { ProjectsScreen } from './screens/ProjectsScreen.tsx'
import type { ProjectsUi } from './types.ts'

const route = getRouteApi('/projects')

type Changed = { of: string | undefined; ui: Partial<ProjectsUi> }

export function ProjectsPage() {
  const state = route.useLoaderData()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // Another ?state= starts from its own ui.
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}) }
  const changeUi = (change: Partial<ProjectsUi>) => {
    setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
  }
  return (
    <ProjectsScreen
      // The app always shows the Settings gear and the drawer's Settings row (d-119); a state's story does not.
      settingsEntry
      navPages={navPages}
      // The Inbox badge is the shown state's number: the page reads no server yet.
      data={state.data}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        const to = navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
      onUiChange={changeUi}
    />
  )
}
