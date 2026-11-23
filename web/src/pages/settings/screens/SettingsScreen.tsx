// The Settings page (d-119) as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with the Settings gear
// selected; on a tablet or phone the tab bar, with More selected, whose More
// opens the More drawer with Settings in it (M3). The page is one column of
// sections: Appearance, Navigation, Notifications (d-118) and New chat
// defaults. The bars show the pages `data.settings.nav` shows, in its order,
// so a change on the page shows in them at once. A state's data and ui are its
// props; the callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop, PageHeader } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { type ChatDefaults, type Mode, type NavPage, navLayout, visibleNavPages } from '../../../lib/deviceSettings.ts'
import type { PushSwitch } from '../../../lib/pushSwitch.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { AppearanceSection } from '../blocks/AppearanceSection.tsx'
import { ChatDefaultsSection } from '../blocks/ChatDefaultsSection.tsx'
import { NavigationSection } from '../blocks/NavigationSection.tsx'
import { NotificationsSection } from '../blocks/NotificationsSection.tsx'
import type { SettingsData, SettingsUi } from '../types.ts'

const column = css({ display: 'flex', flexDirection: 'column', gap: '24' })

export type SettingsScreenProps = {
  data: SettingsData
  ui: SettingsUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  onUiChange?: ((change: Partial<SettingsUi>) => void) | undefined
  /** The live Notifications switch; without it the switch draws `data.push` and does nothing. */
  push?: PushSwitch | undefined
  onModeChange?: ((mode: Mode) => void) | undefined
  /** Shows or hides a nav page; returns false when the nav rules refuse it (the last page besides Home). */
  onNavVisibleChange?: ((page: NavPage, visible: boolean) => boolean) | undefined
  onNavMove?: ((page: NavPage, by: -1 | 1) => void) | undefined
  onChatDefaultsChange?: ((chat: Partial<ChatDefaults>) => void) | undefined
}

export function SettingsScreen({
  data,
  ui,
  viewport,
  onNavigate,
  onUiChange,
  push,
  onModeChange,
  onNavVisibleChange,
  onNavMove,
  onChatDefaultsChange,
}: SettingsScreenProps) {
  const shownPush: PushSwitch = push ?? { ...data.push, onCheckedChange: () => undefined }
  const navPages = visibleNavPages(data.settings.nav)
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => {
        const nav = navLayout(navPages, layout)
        return (
          <Backdrop size={layout}>
            <AppShell
              onDiagnostic={reportShellDiagnostic}
              size={layout}
              view="detail"
              rail={
                layout === 'desktop' ? (
                  <AppRail selected="settings" pages={nav.rail} inboxBadge={data.railBadge} onSelect={onNavigate} />
                ) : undefined
              }
              // The page runs under the tab bar, as every page's list does; its end scrolls clear of it.
              tabBarOverlay
              tabBar={
                layout === 'desktop' ? undefined : (
                  <AppTabBar
                    // Settings is not a tab: More is selected, as it holds Settings (M1).
                    selected="settings"
                    pages={nav.tabs}
                    device={layout === 'tablet' ? 'tablet' : 'phone'}
                    inboxBadge={data.railBadge}
                    onSelect={(next) => {
                      if (next === 'more') onUiChange?.({ moreOpen: true })
                      else onNavigate?.(next)
                    }}
                  />
                )
              }
              detail={
                <DetailFrame layout={layout}>
                  <div className={column}>
                    <PageHeader title="Settings" size={layout === 'phone' ? 'phone' : 'page'} />
                    <AppearanceSection settings={data.settings} layout={layout} onModeChange={onModeChange} />
                    <NavigationSection
                      nav={data.settings.nav}
                      notice={ui.navNotice}
                      onVisibleChange={(page, visible) => {
                        const done = onNavVisibleChange?.(page, visible) ?? true
                        onUiChange?.({ navNotice: done ? undefined : { page, problem: 'noVisiblePage' } })
                      }}
                      onMove={onNavMove}
                    />
                    <NotificationsSection push={shownPush} />
                    <ChatDefaultsSection chat={data.settings.chat} layout={layout} onChange={onChatDefaultsChange} />
                  </div>
                </DetailFrame>
              }
            />
            {/* M3: the phone's and the tablet's More open it (d-119); a state with `moreOpen` shows it at any width. */}
            <MoreDrawer
              open={ui.moreOpen === true}
              onOpenChange={(moreOpen) => {
                onUiChange?.({ moreOpen })
              }}
              pages={navLayout(navPages, layout === 'tablet' ? 'tablet' : 'phone').more}
              selected="settings"
              onNavigate={onNavigate}
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
