// The {{Title}} page's connected entry: the only component of the page that
// reads the router and stores. It passes everything to the screen as props.
import { getRouteApi } from '@tanstack/react-router'
import { {{Page}}Screen } from './screens/{{Page}}Screen.tsx'

const route = getRouteApi('/{{page}}')

export function {{Page}}Page() {
  const state = route.useLoaderData()
  return <{{Page}}Screen data={state.data} ui={state.ui} viewport="desktop" />
}
