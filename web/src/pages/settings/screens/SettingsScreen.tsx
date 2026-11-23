// The Settings page (d-119) as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with the Settings gear
// selected; on a tablet or phone the tab bar, with the Settings tab selected
// when the owner moved Settings into the bar, else More, which opens the More
// drawer with Settings in it (M3). The page is one column of
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
import {
  type BarPage,
  type ChatDefaults,
  type ChatWidth,
  type Mode,
  type NavPage,
  navLayout,
  visibleNavPages,
} from '../../../lib/deviceSettings.ts'
import type { PushSwitch } from '../../../lib/pushSwitch.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { AppearanceSection } from '../blocks/AppearanceSection.tsx'
import { ChatDefaultsSection } from '../blocks/ChatDefaultsSection.tsx'
import { NavigationSection } from '../blocks/NavigationSection.tsx'
import { NotificationsSection } from '../blocks/NotificationsSection.tsx'
import type { SettingsData, SettingsUi } from '../types.ts'

// One readable column, centred, as the lab page draws it (references/settings/).
const column = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '24',
  w: '[100%]',
  maxW: 'shell.dialogWide',
  mx: 'auto',
  pt: '16',
  pb: '40',
})

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
  onChatWidthChange?: ((chatWidth: ChatWidth) => void) | undefined
  /** Shows or hides a nav page; returns false when the nav rules refuse it (the last page besides Home). */
  onNavVisibleChange?: ((page: NavPage, visible: boolean) => boolean) | undefined
  onNavMove?: ((page: BarPage, by: -1 | 1) => void) | undefined
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
  onChatWidthChange,
  onNavVisibleChange,
  onNavMove,
  onChatDefaultsChange,
}: SettingsScreenProps) {
  const shownPush: PushSwitch = push ?? {
    ...data.push,
    onCheckedChange: () => undefined,
    preview: data.settings.pushPreview,
    previewFailed: false,
    onPreviewChange: () => undefined,
  }
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
                  <AppRail
                    settings
                    selected="settings"
                    pages={nav.rail}
                    inboxBadge={data.railBadge}
                    onSelect={onNavigate}
                  />
                ) : undefined
              }
              // The page runs under the tab bar, as every page's list does; its end scrolls clear of it.
              tabBarOverlay
              tabBar={
                layout === 'desktop' ? undefined : (
                  <AppTabBar
                    // The Settings tab when Settings is in the bar; else More, as it holds Settings (M1).
                    selected="settings"
                    pages={nav.tabs}
                    more={nav.more.length > 0}
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
                    <AppearanceSection
                      settings={data.settings}
                      layout={layout}
                      onModeChange={onModeChange}
                      onChatWidthChange={onChatWidthChange}
                    />
                    <NavigationSection
                      nav={data.settings.nav}
                      notice={ui.navNotice}
                      cutAfter={layout !== 'desktop' && nav.more.length > 0 ? nav.tabs.at(-1) : undefined}
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
              settings
              onNavigate={onNavigate}
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
