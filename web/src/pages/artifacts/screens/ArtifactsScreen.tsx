// The Artifacts page as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with Artifacts selected and
// the library beside it (Figma D1); on a tablet or phone the library over
// the tab bar. A state file's data and ui are its props; the callbacks are
// optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { ArtifactsLibrary } from './ArtifactsLibrary.tsx'

export type ArtifactsScreenProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** Reports what Erik changes: the chip, the search, the view and the open groups. */
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
}

export function ArtifactsScreen({ data, ui, viewport, onNavigate, onUiChange }: ArtifactsScreenProps) {
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => (
        <Backdrop size={layout}>
          <AppShell
            size={layout}
            rail={
              layout === 'desktop' ? (
                <AppRail selected="artifacts" inboxBadge={data.railBadge} onSelect={onNavigate} />
              ) : undefined
            }
            tabBar={
              layout === 'desktop' ? undefined : (
                <AppTabBar
                  // The phone opens Artifacts from More (d-105).
                  selected={layout === 'tablet' ? 'artifacts' : 'more'}
                  device={layout === 'tablet' ? 'tablet' : 'phone'}
                  inboxBadge={data.railBadge}
                  onSelect={onNavigate}
                />
              )
            }
            detail={<ArtifactsLibrary data={data} ui={ui} layout={layout} onUiChange={onUiChange} />}
          />
        </Backdrop>
      )}
    </ViewportFrame>
  )
}
