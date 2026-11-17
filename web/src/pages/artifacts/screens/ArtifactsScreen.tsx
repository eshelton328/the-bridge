// The Artifacts page as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with Artifacts selected and
// the library beside it (Figma D1), or, with an artifact open, the library
// as a list and the artifact beside it (D2); on a tablet or phone the
// library over the tab bar. A state file's data and ui are its props; the callbacks are
// optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { ArtifactDetail } from './ArtifactDetail.tsx'
import { ArtifactsLibrary } from './ArtifactsLibrary.tsx'
import { LibraryList } from './LibraryList.tsx'

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
      {(layout) => {
        // D2: the desktop opens an artifact beside the list. A tablet or phone frame of it comes later.
        const open = layout === 'desktop' ? data.open : undefined
        return (
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
              list={
                open === undefined ? undefined : (
                  <LibraryList data={data} ui={ui} selectedId={open.id} onUiChange={onUiChange} />
                )
              }
              detail={
                open === undefined ? (
                  <ArtifactsLibrary data={data} ui={ui} layout={layout} onUiChange={onUiChange} />
                ) : (
                  <ArtifactDetail artifact={open} />
                )
              }
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
