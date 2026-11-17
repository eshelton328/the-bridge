// The Artifacts page's connected entry: the only component of the page that
// reads the router and stores. It passes everything to the screen as props.
import { getRouteApi } from '@tanstack/react-router'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'

const route = getRouteApi('/artifacts')

export function ArtifactsPage() {
  const state = route.useLoaderData()
  return <ArtifactsScreen data={state.data} ui={state.ui} viewport="desktop" />
}
