// The Workspaces page's connected entry: the only component of the page that
// reads the router and stores. It merges the loaded state with what the owner
// changed in it (the page store), passes everything to the screen as props,
// and goes to the page the owner picks in the rail, the phone's tab bar or its
// More drawer. When it reads the live source in development (its home, or
// `?source=live`, d-117) it watches the server's events while it shows
// (liveWorkspaces.ts) and loads its state again when they change it, and the
// live-unavailable notice's Retry loads it again; each live chat pane reads
// its transcript while it shows (useLiveTranscripts.ts); a build has no live code. A chat's Send goes to the page
// store's `send`; a failed send is reported and the composer keeps the draft.
// The composer drafts are saved in sessionStorage as they change and read
// back on load, so Reload app keeps them; a sent chat's draft leaves it
// (draftStorage.ts). Every reply's Copy, sample or live, writes the clipboard
// here through copyText, and its button shows Copied or Copy failed; a fault
// is reported with the clipboard's error only, never the reply's text (audit P-4).
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { readsLive } from '../../lib/dataSource.ts'
import { workspacesSources } from './loadWorkspacesState.ts'
import { layoutsSeenOf, withLoadedLayouts } from './blocks/workspaceLayout.ts'
import { loadDrafts, saveDrafts } from './draftStorage.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { useLiveTranscripts } from './useLiveTranscripts.ts'
import { useWorkspacesActions, useWorkspacesUi } from './workspacesStore.ts'

const route = getRouteApi('/workspaces')

/** A reply's Copy: a refusal that is not the browser's NotAllowedError goes to `report`, without the text. */
const copyReply = (text: string) =>
  copyText(text, {
    report: (error) => {
      report(error, 'handler')
    },
  })

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
  // The drafts saved before the last reload, read once; what the owner types after it wins.
  const [saved] = useState(() => loadDrafts(search.state))
  // One object per change, so the screen starts again from the merged ui only when the store changes. A loaded layout
  // newer than the owner's change, such as a herdr layout read again, replaces his (withLoadedLayouts).
  const current = state.data.current
  const ui = useMemo(() => {
    const merged = withLoadedLayouts(state.ui, changed, current)
    return Object.keys(saved).length === 0 ? merged : { ...merged, drafts: { ...saved, ...merged.drafts } }
  }, [state.ui, changed, current, saved])
  const { data, transcripts } = useLiveTranscripts(import.meta.env.DEV && live, state.data)
  return (
    <WorkspacesScreen
      data={data}
      ui={ui}
      viewport="desktop"
      onUiChange={(change) => {
        // Saved before the render, so a keystroke that crashes the page is kept for Reload app.
        if (change.drafts !== undefined) saveDrafts(search.state, change.drafts)
        // Each change keeps the layouts and focus the owner sees now, and which loaded layouts he saw, so a newer one
        // replaces only what he changed before it came.
        setUi(search.state, {
          ...(ui.layouts === undefined ? {} : { layouts: ui.layouts, focusedPane: ui.focusedPane }),
          ...change,
          layoutsSeen: layoutsSeenOf(state.ui.layouts),
        })
      }}
      onRetry={() => void router.invalidate()}
      transcripts={transcripts}
      onCopy={copyReply}
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
