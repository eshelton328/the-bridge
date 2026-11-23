// The app's shell while a page waits for its data (the loading standard, 2026-11-23): the rail on the desktop
// and the tab bar on a tablet or phone draw at once, with the page selected, and the page's place holds
// skeletons in a status that says what loads. A page with a skeleton of its own draws its screen with
// `loading` instead (the Inbox). Props only.
import { AppShell, Backdrop, DetailBodySkeleton, SkeletonGroup } from '@eshelton328/component-library-1701'
import { css } from '../../styled-system/css/index.js'
import { reportShellDiagnostic } from '../errors/shellDiagnostic.ts'
import { type BarPage, navLayout } from '../lib/deviceSettings.ts'
import type { Viewport } from '../lib/screenState.ts'
import { AppRail } from './AppRail.tsx'
import { AppTabBar } from './AppTabBar.tsx'
import { ViewportFrame } from './ViewportFrame.tsx'

const body = css({ p: '16', bg: 'surface.pane', flex: '1' })

export type LoadingShellProps = {
  /** The page that loads, selected in the rail or the tab bar. */
  selected: BarPage
  /** What a screen reader says while it loads, such as "Loading Workspaces". */
  label: string
  /** The shown nav pages in the owner's order. */
  navPages: readonly BarPage[]
  /** Draws the Settings gear in the rail (d-119), as every page entry does. */
  settings?: boolean | undefined
  /** A tap on a rail item or a tab; the tab bar's More does nothing while the page loads. */
  onNavigate?: ((page: string) => void) | undefined
  /** The layout before the frame measures its width. */
  viewport: Viewport
}

export function LoadingShell({ selected, label, navPages, settings, onNavigate, viewport }: LoadingShellProps) {
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => {
        const nav = navLayout(navPages, layout)
        const desktop = layout === 'desktop'
        return (
          <Backdrop size={layout}>
            <AppShell
              onDiagnostic={reportShellDiagnostic}
              size={layout}
              view="detail"
              rail={
                desktop ? (
                  <AppRail
                    settings={settings}
                    selected={selected}
                    pages={nav.rail}
                    inboxBadge={0}
                    onSelect={onNavigate}
                  />
                ) : undefined
              }
              tabBarOverlay
              tabBar={
                desktop ? undefined : (
                  <AppTabBar
                    selected={selected}
                    pages={nav.tabs}
                    more={nav.more.length > 0}
                    device={layout === 'tablet' ? 'tablet' : 'phone'}
                    inboxBadge={0}
                    onSelect={(next) => {
                      if (next !== 'more') onNavigate?.(next)
                    }}
                  />
                )
              }
              detail={
                <div className={body} data-loading="page">
                  <SkeletonGroup label={label}>
                    <DetailBodySkeleton lines={6} />
                  </SkeletonGroup>
                </div>
              }
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
