// The Toolkit page while its route loads (R58, the loading standard: the page's real layout, so nothing moves when it
// loads). The Toolkit reads no server: its home is local data (home.ts), so the pending page is that home itself, the
// list laid out for the window, with the live Inbox badge as the page entry has in development. It reads the nav order
// like the page entry. What the owner changes here goes to the page's store, so the loaded page starts from it
// (toolkitStore.ts), and a copy writes the clipboard as the loaded page does.
import { useNavigate } from '@tanstack/react-router'
import { report } from '../../errors/reporter.ts'
import { copyText } from '../../lib/copyText.ts'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { useVisibleNavPages } from '../../state/settingsStore.ts'
import { toolkitHome } from './home.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import { useToolkitActions, useToolkitPendingUi } from './toolkitStore.ts'
import { readsLiveServer } from '../../lib/dataSource.ts'

const reportCopy = (error: unknown) => {
  report(error, 'handler')
}

export function ToolkitPending() {
  const navPages = useVisibleNavPages()
  const navigate = useNavigate()
  const railBadge = useInboxBadge(toolkitHome.data.railBadge, readsLiveServer())
  const changed = useToolkitPendingUi()
  const { changePending } = useToolkitActions()
  return (
    <ToolkitScreen
      settingsEntry
      navPages={navPages}
      data={{ ...toolkitHome.data, railBadge }}
      ui={{ ...toolkitHome.ui, ...changed }}
      viewport="desktop"
      onNavigate={(page) => {
        // The desktop rail's More goes to Toolkit (d-105), as on the loaded page.
        const to = page === 'more' ? '/toolkit' : navRoute(page)
        if (to !== undefined) void navigate({ to })
      }}
      onUiChange={changePending}
      onCopyPath={(path) => {
        void copyText(path, { report: reportCopy })
      }}
      onCopyText={(text) => {
        void copyText(text, { report: reportCopy })
      }}
    />
  )
}
