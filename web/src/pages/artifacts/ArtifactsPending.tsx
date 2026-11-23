// The Artifacts page while its route loads (R58, the loading standard): the page's real layout at once, with its
// header, chips and tools drawn but off and with no counts, the status saying the library checks Claude, and cards
// (rows on the phone) that load in the loaded grid's place, after the router's pendingMs (app/router.ts). It reads the
// nav order and the Inbox badge like the page entry; only More and the nav do anything.
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { artifactsHome } from './home.ts'
import { checkingLine } from './liveLibrary.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import type { ArtifactsUi } from './types.ts'

export function ArtifactsPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  const railBadge = useInboxBadge(0, true)
  // Only the More drawer opens while the page loads: every other control is off.
  const [ui, setUi] = useState<ArtifactsUi>(artifactsHome.ui)
  return (
    <ArtifactsScreen
      settingsEntry
      loading
      navPages={navPages}
      data={{ ...artifactsHome.data, found: checkingLine, railBadge }}
      ui={ui}
      viewport="desktop"
      onUiChange={(change) => {
        setUi((now) => ({ ...now, ...change }))
      }}
      onNavigate={(page) => {
        const to = navRoute(page)
        if (to !== undefined && to !== '/artifacts') void navigate({ to })
      }}
    />
  )
}
