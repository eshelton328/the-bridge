// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It passes everything to the screen as props.
import { getRouteApi } from '@tanstack/react-router'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

const route = getRouteApi('/workspaces')

export function WorkspacesPage() {
  const state = route.useLoaderData()
  return <WorkspacesScreen data={state.data} ui={state.ui} viewport="desktop" />
}
