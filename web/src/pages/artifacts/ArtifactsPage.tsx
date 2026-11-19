// The Artifacts page's connected entry: the only component of the page that
// reads the router. It keeps what the owner changes in the shown state (the chip,
// the search, the view, the open groups) and passes everything to the
// props-only screen.
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import type { ArtifactsUi } from './types.ts'

const route = getRouteApi('/artifacts')

type Changed = { of: string | undefined; ui: Partial<ArtifactsUi> }

export function ArtifactsPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // Another ?state= starts from its own ui.
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}) }
  return (
    <ArtifactsScreen
      data={state.data}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        if (page === 'inbox' || page === 'workspaces' || page === 'toolkit') void navigate({ to: `/${page}` })
      }}
      onUiChange={(change) => {
        setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
      }}
    />
  )
}
