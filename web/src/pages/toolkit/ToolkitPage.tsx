// The Toolkit page's connected entry: the only component of the page that
// reads the router. It keeps what Erik changes in the shown state's view
// (the view, the kind chip, the search, the groups he closed) until another
// state loads, and passes everything to the props-only screen.
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import type { ToolkitUi } from './types.ts'

const route = getRouteApi('/toolkit')

type Changed = { of: ToolkitUi; ui: Partial<ToolkitUi> }

export function ToolkitPage() {
  const state = route.useLoaderData()
  const navigate = route.useNavigate()
  const [changed, setChanged] = useState<Changed>({ of: state.ui, ui: {} })
  const own = changed.of === state.ui ? changed.ui : {}
  return (
    <ToolkitScreen
      data={state.data}
      ui={{ ...state.ui, ...own }}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        if (page === 'inbox' || page === 'artifacts' || page === 'toolkit') void navigate({ to: `/${page}` })
      }}
      onUiChange={(change) => {
        setChanged({ of: state.ui, ui: { ...own, ...change } })
      }}
    />
  )
}
