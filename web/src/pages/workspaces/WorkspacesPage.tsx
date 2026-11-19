// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It merges the loaded state with what the owner
// changed in it (the page store), passes everything to the screen as props,
// and goes to the page the owner picks in the rail, the phone's tab bar or its
// More drawer.
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { useWorkspacesActions, useWorkspacesUi } from './workspacesStore.ts'

const route = getRouteApi('/workspaces')

export function WorkspacesPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const changed = useWorkspacesUi(search.state)
  const { setUi, showState } = useWorkspacesActions()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  // One object per change, so the screen starts again from the merged ui only when the store changes.
  const ui = useMemo(() => ({ ...state.ui, ...changed }), [state.ui, changed])
  return (
    <WorkspacesScreen
      data={state.data}
      ui={ui}
      viewport="desktop"
      onUiChange={(change) => {
        setUi(search.state, change)
      }}
      onNavigate={(page) => {
        // The tablet's More (the phone opens its drawer) goes to Toolkit, the one page behind More with a route
        // (d-105), as the tablet has no rail.
        if (page === 'more') void navigate({ to: '/toolkit' })
        // Only the pages that have a route go somewhere; the others wait for theirs.
        else if (page === 'inbox' || page === 'workspaces' || page === 'artifacts' || page === 'toolkit')
          void navigate({ to: `/${page}` })
      }}
    />
  )
}
