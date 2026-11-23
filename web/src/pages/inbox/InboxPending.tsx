// The Inbox while its route loads (the loading standard, 2026-11-23): after the router's pendingMs
// (app/router.ts) the screen draws at once on the live Inbox with no items, in the owner's nav order, with the
// list's skeleton in place of its groups, so a cold start or a tap on the Inbox never shows an empty screen.
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { inboxHome } from './home.ts'
import { emptyInbox } from './liveInbox.ts'
import { liveList } from './liveList.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'

export function InboxPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  const [state] = useState(() => liveList(inboxHome, emptyInbox, { now: new Date() }))
  return (
    <InboxScreen
      loading
      settingsEntry
      navPages={navPages}
      data={state.data}
      ui={state.ui}
      viewport="desktop"
      onNavigate={(page) => {
        // The desktop rail's More goes to Toolkit (d-105), as on the loaded page.
        const to = page === 'more' ? '/toolkit' : navRoute(page)
        if (to !== undefined && to !== '/inbox') void navigate({ to })
      }}
    />
  )
}
