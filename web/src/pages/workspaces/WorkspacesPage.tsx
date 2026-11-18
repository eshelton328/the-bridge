// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It passes everything to the screen as props,
// and goes to the page Erik picks in the rail, the phone's tab bar or its
// More drawer.
import { getRouteApi } from '@tanstack/react-router'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

const route = getRouteApi('/workspaces')

export function WorkspacesPage() {
  const state = route.useLoaderData()
  const navigate = route.useNavigate()
  return (
    <WorkspacesScreen
      data={state.data}
      ui={state.ui}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        if (page === 'inbox' || page === 'workspaces' || page === 'artifacts' || page === 'toolkit')
          void navigate({ to: `/${page}` })
      }}
    />
  )
}
