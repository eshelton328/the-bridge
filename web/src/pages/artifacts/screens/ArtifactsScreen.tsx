// The Artifacts page as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with Artifacts selected and
// the library beside it (Figma D1), or, with an artifact open, the library
// as a list and the artifact beside it (D2), or with its discussion open
// the artifact and the discussion, the list closed (D7), and in it a
// proposed change with Apply, Discard and Edit first (D8), which Apply
// turns into the applied artifact and proposal (D9); on a tablet or phone the
// library over the tab bar, and on a tablet an open artifact on its own page
// under Back (T2), whose Discuss opens the discussion as a page of its own
// with no tab bar (T4). A state file's data and ui are its props; the
// callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import type { ProposalAct } from '../blocks/ArtifactProposal.tsx'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import { ArtifactDetail } from './ArtifactDetail.tsx'
import { ArtifactDiscussionPage } from './ArtifactDiscussionPage.tsx'
import { ArtifactPage } from './ArtifactPage.tsx'
import { ArtifactsLibrary } from './ArtifactsLibrary.tsx'
import { appliedView, discussionEntries, proposalEffect } from './discussionView.ts'
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
        // D2: the desktop opens an artifact beside the list; T2: the tablet on its own page, until Back closes it.
        // A phone frame of it comes later.
        const open = layout === 'desktop' || (layout === 'tablet' && ui.artifactClosed !== true) ? data.open : undefined
        // D9: after Apply the artifact shows Updated and the proposal its applied form.
        const view = open === undefined ? undefined : appliedView(open, data.discussion, ui)
        // D7: Discuss opens the artifact's discussion beside it, and the list closes. T4: on a tablet it opens as a
        // page of its own, and the tab bar hides. A phone frame of it comes later.
        const discussion = layout === 'phone' ? undefined : view?.discussion
        const discussing = discussion !== undefined && ui.discussOpen === true
        const sent = ui.discussSent ?? []
        // What the desktop panel and the tablet page share: the draft, the entries and where Erik's presses go.
        const thread =
          discussion === undefined || view === undefined
            ? undefined
            : {
                discussion,
                draft: ui.discussDraft,
                entries: discussionEntries(discussion, ui),
                applied: view.applied,
                onAct: (act: ProposalAct) => {
                  onUiChange?.(proposalEffect(discussion, act))
                },
                onDraftChange:
                  onUiChange === undefined
                    ? undefined
                    : (text: string) => {
                        onUiChange({ discussDraft: text })
                      },
                onSend: (text: string) => {
                  onUiChange?.({ discussSent: [...sent, text], discussDraft: '' })
                },
              }
        const closeDiscussion = () => {
          onUiChange?.({ discussOpen: false })
        }
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
                layout === 'desktop' || (layout === 'tablet' && discussing) ? undefined : (
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
                open === undefined || discussing || layout !== 'desktop' ? undefined : (
                  <LibraryList data={data} ui={ui} selectedId={open.id} onUiChange={onUiChange} />
                )
              }
              detail={
                open === undefined || view === undefined ? (
                  <ArtifactsLibrary data={data} ui={ui} layout={layout} onUiChange={onUiChange} />
                ) : layout === 'tablet' && discussing && thread !== undefined ? (
                  <ArtifactDiscussionPage
                    {...thread}
                    artifact={view.artifact}
                    badge={view.badge}
                    onBack={closeDiscussion}
                  />
                ) : layout === 'tablet' ? (
                  <ArtifactPage
                    artifact={view.artifact}
                    badge={view.badge}
                    backLabel={data.title}
                    onBack={() => {
                      onUiChange?.({ artifactClosed: true })
                    }}
                    onDiscuss={
                      discussion === undefined
                        ? undefined
                        : () => {
                            onUiChange?.({ discussOpen: true })
                          }
                    }
                  />
                ) : (
                  <ArtifactDetail
                    artifact={view.artifact}
                    badge={view.badge}
                    onDiscuss={
                      discussion === undefined
                        ? undefined
                        : () => {
                            onUiChange?.({ discussOpen: !discussing })
                          }
                    }
                    madeInLayer={discussion?.layers.madeIn}
                    side={
                      discussing && thread !== undefined ? (
                        <DiscussionPanel {...thread} onClose={closeDiscussion} />
                      ) : undefined
                    }
                  />
                )
              }
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
