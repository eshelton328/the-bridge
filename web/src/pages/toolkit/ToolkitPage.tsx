// The Toolkit page's connected entry: the only component of the page that
// reads the router. It keeps what the owner changes in the shown state's view
// (the view, the kind chip, the search, the groups he closed, the open item)
// until another state loads, and passes everything to the props-only screen.
// The open item's copy button writes its path to the clipboard here.
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import type { ToolkitUi } from './types.ts'
import { usePushSwitch } from '../../state/pushStore.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'

const route = getRouteApi('/toolkit')

const reportCopy = (error: unknown) => {
  report(error, 'handler')
}

type Changed = { of: ToolkitUi; ui: Partial<ToolkitUi> }

export function ToolkitPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  // The Toolkit has no live source yet, but its home (no ?state=, no ?source=) is the owner's app in development, so
  // its Inbox badge is the app's live count; a state or a source keeps the state's number (lib/inboxFeed.ts).
  const railBadge = useInboxBadge(
    state.data.railBadge,
    import.meta.env.DEV && search.state === undefined && search.source === undefined,
  )
  const push = usePushSwitch()
  const navPages = useVisibleNavPages()
  const navigate = route.useNavigate()
  const [changed, setChanged] = useState<Changed>({ of: state.ui, ui: {} })
  const own = changed.of === state.ui ? changed.ui : {}
  return (
    <ToolkitScreen
      push={push}
      navPages={navPages}
      data={{ ...state.data, railBadge }}
      ui={{ ...state.ui, ...own }}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        if (page === 'inbox' || page === 'workspaces' || page === 'artifacts' || page === 'toolkit')
          void navigate({ to: `/${page}` })
      }}
      onUiChange={(change) => {
        setChanged({ of: state.ui, ui: { ...own, ...change } })
      }}
      onCopyPath={(path) => {
        // The badge's copy button shows no result; a page without clipboard access (an insecure origin) copies
        // nothing, and a fault is reported.
        void copyText(path, { report: reportCopy })
      }}
      onCopyText={(text) => {
        // An answer's Copy in the item's discussion (D5).
        void copyText(text, { report: reportCopy })
      }}
    />
  )
}
