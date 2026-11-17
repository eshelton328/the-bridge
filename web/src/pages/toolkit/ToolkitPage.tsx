// The Toolkit page's connected entry: the only component of the page that
// reads the router and stores. It passes everything to the screen as props.
import { getRouteApi } from '@tanstack/react-router'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'

const route = getRouteApi('/toolkit')

export function ToolkitPage() {
  const state = route.useLoaderData()
  return <ToolkitScreen data={state.data} ui={state.ui} viewport="desktop" />
}
