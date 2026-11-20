// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It merges the loaded state with what the owner
// changed in it (the page store), passes everything to the screen as props,
// and goes to the page the owner picks in the rail, the phone's tab bar or its
// More drawer. With `?source=live` in development it watches the server's
// events while it shows (liveWorkspaces.ts) and loads its state again when
// they change it; a build has no live code. A chat's Send goes to the page
// store's `send`; a failed send is reported and the composer keeps the draft.
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { report } from '../../errors/reporter.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { useWorkspacesActions, useWorkspacesUi } from './workspacesStore.ts'

const route = getRouteApi('/workspaces')

export function WorkspacesPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const changed = useWorkspacesUi(search.state)
  const { setUi, showState, send } = useWorkspacesActions()
  const router = useRouter()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  useEffect(() => {
    let stop: (() => void) | undefined
    let gone = false
    if (import.meta.env.DEV && search.source === 'live') {
      void import('./liveWorkspaces.ts').then((live) => {
        if (!gone) stop = live.watchLiveWorkspaces({ onChange: () => void router.invalidate() })
      })
    }
    return () => {
      gone = true
      stop?.()
    }
  }, [router, search.source])
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
      onSend={(chat, text) =>
        send(chat, text).then(
          () => true,
          (error: unknown) => {
            report(error, 'handler')
            return false
          },
        )
      }
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
