// The Artifacts page's connected entry: the only component of the page that
// reads the router. It keeps what the owner changes in the shown state (the chip,
// the search, the view, the open groups) and passes everything to the
// props-only screen. Copy link writes the open artifact's link to the
// clipboard here, and the screen shows "Copied" or "Copy failed" on the
// control for `copiedFor` ms (audit W-6). On the live library (liveArtifacts.ts)
// it holds the visit, posts seen once its first list shows, reads a partial
// list once more, and sends Add a link, a project pick and Remove to the server
// (useArtifactWrites.ts).
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { enterVisit, sendSeen, takeFollowUp } from './liveArtifacts.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { useArtifactWrites } from './useArtifactWrites.ts'
import type { ArtifactsUi, CopiedLink } from './types.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'

const route = getRouteApi('/artifacts')

type Changed = { of: string | undefined; ui: Partial<ArtifactsUi> }

/** How long Copy link shows what it did before it reads "Copy link" again. */
const copiedFor = 2000

const reportCopy = (error: unknown) => {
  report(error, 'handler')
}

export function ArtifactsPage() {
  const state = route.useLoaderData()
  const navPages = useVisibleNavPages()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const router = useRouter()
  const live = state.data.live
  const isLive = live !== undefined
  // A visit of the live library: it starts when the page shows and ends when it leaves.
  useEffect(() => (isLive ? enterVisit() : undefined), [isLive])
  // Seen goes once the visit's first list shows; a partial list reads once more, with no loop.
  useEffect(() => {
    if (live === undefined) return
    void sendSeen()
    if (takeFollowUp(live.partial)) void router.invalidate()
  }, [live, router])
  // Another ?state= starts from its own ui.
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}) }
  const changeUi = (change: Partial<ArtifactsUi>) => {
    setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
  }
  const writes = useArtifactWrites(changeUi, () => router.invalidate())
  // A new object on each press, so a second press starts the time again.
  const [copiedLink, setCopiedLink] = useState<CopiedLink | undefined>(undefined)
  useEffect(() => {
    if (copiedLink === undefined) return
    const timer = setTimeout(() => {
      setCopiedLink(undefined)
    }, copiedFor)
    return () => {
      clearTimeout(timer)
    }
  }, [copiedLink])
  // The Inbox badge: the app's live count on the live home, the shown state's number on fixtures (lib/inboxFeed.ts).
  const railBadge = useInboxBadge(state.data.railBadge, live !== undefined)
  return (
    <ArtifactsScreen
      navPages={navPages}
      data={{ ...state.data, railBadge }}
      ui={ui}
      viewport="desktop"
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        const to = navRoute(page)
        if (to !== undefined && to !== '/artifacts') void navigate({ to })
      }}
      onUiChange={(change) => {
        if (change.addLinkOpen === true) writes.clearAddLink()
        changeUi(change)
      }}
      onCopyLink={(link) => {
        // Copy link on an open artifact (D2, T2, M2); without clipboard access it shows Copy failed.
        void copyText(link, { report: reportCopy }).then((result) => {
          setCopiedLink({ link, status: result.ok ? 'copied' : 'failed' })
        })
      }}
      copiedLink={copiedLink}
      {...(isLive
        ? { onAddLink: writes.onAddLink, onFile: writes.onFile, onRemove: writes.onRemove, notice: writes.notice }
        : {})}
    />
  )
}
