// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It merges the loaded state with what the owner
// changed in it (the page store), passes everything to the screen as props,
// and goes to the page the owner picks in the rail, the phone's tab bar or its
// More drawer. When it reads the live source in development (its home, or
// `?source=live`, d-117) it watches the server's events while it shows
// (liveWorkspaces.ts) and loads its state again when they change it, and the
// live-unavailable notice's Retry loads it again; a build has no live code. A chat's Send goes to the page
// store's `send`; a failed send is reported and the composer keeps the draft.
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { report } from '../../errors/reporter.ts'
import { readsLive } from '../../lib/dataSource.ts'
import { workspacesSources } from './loadWorkspacesState.ts'
import { layoutsSeenOf, withLoadedLayouts } from './blocks/workspaceLayout.ts'
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
  const live = readsLive({ state: search.state, source: search.source }, workspacesSources)
  useEffect(() => {
    let stop: (() => void) | undefined
    let gone = false
    if (import.meta.env.DEV && live) {
      void import('./liveWorkspaces.ts').then((live) => {
        if (!gone) stop = live.watchLiveWorkspaces({ onChange: () => void router.invalidate() })
      })
    }
    return () => {
      gone = true
      stop?.()
    }
  }, [router, live])
  // One object per change, so the screen starts again from the merged ui only when the store changes. A loaded layout
  // newer than the owner's change, such as a herdr layout read again, replaces his (withLoadedLayouts).
  const current = state.data.current
  const ui = useMemo(() => withLoadedLayouts(state.ui, changed, current), [state.ui, changed, current])
  return (
    <WorkspacesScreen
      data={state.data}
      ui={ui}
      viewport="desktop"
      onUiChange={(change) => {
        // Each change keeps the layouts and focus the owner sees now, and which loaded layouts he saw, so a newer one
        // replaces only what he changed before it came.
        setUi(search.state, {
          ...(ui.layouts === undefined ? {} : { layouts: ui.layouts, focusedPane: ui.focusedPane }),
          ...change,
          layoutsSeen: layoutsSeenOf(state.ui.layouts),
        })
      }}
      onRetry={() => void router.invalidate()}
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
