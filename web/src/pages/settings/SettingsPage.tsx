// The Settings page's connected entry (d-119): the only component of the page
// that reads the router and stores. With no `?state=` it shows the settings
// saved on this device (state/settingsStore.ts) and the live Notifications
// switch (state/pushStore.ts), and each change goes to the store, which saves
// it and applies the mode at once (app/main.ts). A `?state=` shows that
// state's values. It keeps the owner's view changes (the More drawer, a nav
// line) for the shown state only.
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useInboxBadge } from '../../lib/inboxFeed.ts'
import { navRoute } from '../../lib/navRoutes.ts'
import { usePushSwitch } from '../../state/pushStore.ts'
import {
  useSettingsActions,
  useSettingsChatDefaults,
  useSettingsMode,
  useSettingsNav,
  useSettingsChatWidth,
  useSettingsTextSize,
} from '../../state/settingsStore.ts'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import type { SettingsUi } from './types.ts'

const route = getRouteApi('/settings')

type Changed = { of: string | undefined; ui: Partial<SettingsUi> }

export function SettingsPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // A production build ignores `?state=`, as readState does (lib/dataSource.ts), so it always shows the saved settings.
  const own = !import.meta.env.DEV || search.state === undefined
  const mode = useSettingsMode()
  const textSize = useSettingsTextSize()
  const chatWidth = useSettingsChatWidth()
  const nav = useSettingsNav()
  const chat = useSettingsChatDefaults()
  const actions = useSettingsActions()
  const push = usePushSwitch()
  // The Inbox badge: the app's live count on the home in development, the state's number otherwise (lib/inboxFeed.ts).
  const railBadge = useInboxBadge(state.data.railBadge, import.meta.env.DEV && own && search.source === undefined)
  const [changed, setChanged] = useState<Changed>({ of: search.state, ui: {} })
  const ui = { ...state.ui, ...(changed.of === search.state ? changed.ui : {}) }
  const settings = own ? { mode, textSize, chatWidth, nav: [...nav], chat } : state.data.settings
  return (
    <SettingsScreen
      data={{ ...state.data, railBadge, settings }}
      ui={ui}
      viewport="desktop"
      {...(own ? { push } : {})}
      onNavigate={(page) => {
        // Only the pages that have a route go somewhere; the others wait for theirs.
        const to = navRoute(page)
        if (to !== undefined && to !== '/settings') void navigate({ to })
      }}
      onUiChange={(change) => {
        setChanged((c) => ({ of: search.state, ui: { ...(c.of === search.state ? c.ui : {}), ...change } }))
      }}
      onModeChange={actions.setMode}
      onChatWidthChange={actions.setChatWidth}
      // Settings has no switch, so no page on screen can be hidden here; only the last-page rule can refuse.
      onNavVisibleChange={(page, visible) => actions.setNavPageVisible(page, visible, undefined) === undefined}
      onNavMove={actions.moveNavPage}
      onChatDefaultsChange={actions.setChatDefaults}
    />
  )
}
