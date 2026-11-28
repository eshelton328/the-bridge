// The Projects page as one props-only screen, laid out by the width it gets
// (ViewportFrame): on the desktop the rail with Projects selected and the
// home beside it (D10); on a tablet or phone the home over the tab bar (T10,
// M10), whose More opens the shared More drawer. An iPad in landscape (T10b,
// 1133 px) is narrower than the desktop layout and draws the tablet one. A
// state's data and ui are its props; the callbacks are optional, so a story or
// a canvas board needs none. On the live projects the entry passes `onPin`,
// which sends a pin to the server.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { type BarPage, defaultVisiblePages, navLayout } from '../../../lib/deviceSettings.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { QuickChat } from '../blocks/QuickChat.tsx'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { ProjectDetail } from './ProjectDetail.tsx'
import { ProjectsHome } from './ProjectsHome.tsx'

export type ProjectsScreenProps = {
  /** Draws the Settings gear in the rail and the Settings row in the More drawer (d-119): the page entry passes it; a state does not. */
  settingsEntry?: boolean | undefined
  data: ProjectsData
  ui: ProjectsUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** The shown nav pages in the owner's order (d-038, d-119); the default order without it. */
  navPages?: readonly BarPage[] | undefined
  /** Reports what the owner changes: the open ⋯ menu and the More drawer. */
  onUiChange?: ((change: Partial<ProjectsUi>) => void) | undefined
  /** Pin to top or Unpin was picked on the card `slug` (R3). */
  onPin?: ((slug: string, pinned: boolean) => void) | undefined
  /** A card was clicked: open its project's page (R4). */
  onOpen?: ((slug: string) => void) | undefined
  /** Back to Projects was pressed on a project's page. */
  onBack?: (() => void) | undefined
  /** Quick chat's send (R8): true once the chat is open. Without it Quick chat does nothing. */
  onQuickChatSend?: ((text: string) => Promise<boolean>) | undefined
  onQuickChatRetry?: (() => void) | undefined
  /** Context drift's Run check (R9). Without it Run check is off. */
  onRunDrift?: (() => void) | undefined
  /** A Chats panel row was pressed (R7): open that chat. */
  onChatOpen?: ((id: string) => void) | undefined
  /** An idea row was picked (R11), and Back to Ideas on its page. */
  onIdeaOpen?: ((id: string) => void) | undefined
  onIdeaBack?: (() => void) | undefined
  /** Starts a chat about the open idea (NCC-132 AC2); with none the idea's page shows no button. */
  onIdeaChat?: (() => void) | undefined
  /** A repository card's Architecture (d-135): open the Architecture tab on that repository. */
  onArchitecture?: ((repo: string) => void) | undefined
}

export function ProjectsScreen({
  settingsEntry,
  data,
  ui,
  viewport,
  onNavigate,
  navPages = defaultVisiblePages,
  onUiChange,
  onPin,
  onOpen,
  onBack,
  onQuickChatSend,
  onQuickChatRetry,
  onRunDrift,
  onChatOpen,
  onIdeaOpen,
  onIdeaBack,
  onIdeaChat,
  onArchitecture,
}: ProjectsScreenProps) {
  // The project page of `ui.open` (R4); the home when it names no card.
  const open = data.projects.find((p) => p.slug === ui.open)
  const chat = open === undefined || onQuickChatSend === undefined ? undefined : ui.quickChat
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => {
        const nav = navLayout(navPages, layout)
        const quickChat =
          chat === undefined || onQuickChatSend === undefined ? null : (
            <QuickChat
              words={data.page}
              status={chat}
              onSend={onQuickChatSend}
              onRetry={onQuickChatRetry}
              onClose={() => {
                onUiChange?.({ quickChat: undefined })
              }}
            />
          )
        return (
          <Backdrop size={layout}>
            <AppShell
              onDiagnostic={reportShellDiagnostic}
              size={layout}
              rail={
                layout === 'desktop' ? (
                  <AppRail
                    settings={settingsEntry}
                    selected="projects"
                    pages={nav.rail}
                    inboxBadge={data.railBadge}
                    onSelect={onNavigate}
                  />
                ) : undefined
              }
              // The home runs under the tab bar, as T10 and M10 draw it; its end scrolls clear of it.
              tabBarOverlay
              tabBar={
                layout === 'desktop' ? undefined : (
                  <AppTabBar
                    selected="projects"
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
                open === undefined ? (
                  <ProjectsHome
                    data={data}
                    ui={ui}
                    layout={layout}
                    onUiChange={onUiChange}
                    onPin={onPin}
                    onOpen={onOpen}
                  />
                ) : (
                  <ProjectDetail
                    project={open}
                    data={data}
                    ui={ui}
                    layout={layout}
                    onUiChange={onUiChange}
                    onBack={onBack}
                    onRunDrift={onRunDrift}
                    onChatOpen={onChatOpen}
                    onIdeaOpen={onIdeaOpen}
                    onIdeaBack={onIdeaBack}
                    onIdeaChat={onIdeaChat}
                    onArchitecture={onArchitecture}
                    onQuickChat={() => {
                      onUiChange?.({ quickChat: {} })
                    }}
                  />
                )
              }
            />
            {quickChat}
            {/* The tablet's and the phone's More open the shared More drawer (d-119). */}
            <MoreDrawer
              settings={settingsEntry}
              open={ui.moreOpen === true}
              onOpenChange={(moreOpen) => {
                onUiChange?.({ moreOpen })
              }}
              pages={navLayout(navPages, layout === 'tablet' ? 'tablet' : 'phone').more}
              selected="projects"
              onNavigate={onNavigate}
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
