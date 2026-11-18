// The Artifacts page as one props-only screen, laid out by the width it
// gets (ViewportFrame): on the desktop the rail with Artifacts selected and
// the library beside it (Figma D1), or, with an artifact open, the library
// as a list and the artifact beside it (D2), or with its discussion open
// the artifact and the discussion, the list closed (D7), and in it a
// proposed change with Apply, Discard and Edit first (D8), which Apply
// turns into the applied artifact and proposal (D9); on a tablet or phone the
// library over the tab bar, and on a tablet an open artifact on its own page
// under Back (T2), whose Discuss opens the discussion as a page of its own
// with no tab bar (T4), and whose proposal's Apply returns to the artifact's
// page, which shows Updated (T5); on a phone the library as a list of rows
// (M1, LibraryPhone), and an open artifact on its own page under Back, as
// on a tablet, with the ⋯ button for File in a project (M2), which opens
// it as a sheet (M7); the phone's More opens the shared More drawer over the
// tab bar (M8). A state file's data and ui are its props; the
// callbacks are optional, so a story or a canvas board needs none.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import type { ProposalAct } from '../blocks/ArtifactProposal.tsx'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import { FileSheet } from '../blocks/FileSheet.tsx'
import { ArtifactDetail } from './ArtifactDetail.tsx'
import { ArtifactDiscussionPage } from './ArtifactDiscussionPage.tsx'
import { ArtifactPage } from './ArtifactPage.tsx'
import { ArtifactsLibrary } from './ArtifactsLibrary.tsx'
import { appliedView, discussionEntries, proposalEffect } from './discussionView.ts'
import { LibraryList } from './LibraryList.tsx'
import { LibraryPhone } from './LibraryPhone.tsx'

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
        // D2: the desktop opens an artifact beside the list; T2 and M2: a tablet or phone on its own page, until Back
        // closes it.
        const open = layout === 'desktop' || ui.artifactClosed !== true ? data.open : undefined
        // D9: after Apply the artifact shows Updated and the proposal its applied form.
        const view = open === undefined ? undefined : appliedView(open, data.discussion, ui)
        // D7: Discuss opens the artifact's discussion beside it, and the list closes. T4: on a tablet it opens as a
        // page of its own, and the tab bar hides. The phone's discussion page comes with M9; there Discuss sets
        // `discussOpen` and the artifact's page stays.
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
                // T5: on the tablet's page Apply returns to the artifact's page, which shows Updated.
                onAct: (act: ProposalAct) => {
                  onUiChange?.(proposalEffect(discussion, act, layout === 'tablet' ? 'page' : 'panel'))
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
              // The library and the artifact's page on a tablet or phone (T2, M2) run under the tab bar, as Figma draws them; their
              // end scrolls clear of it (ArtifactsStickyBars.test.tsx, PhoneTabBar.test.tsx).
              tabBarOverlay
              tabBar={
                layout === 'desktop' || (layout === 'tablet' && discussing) ? undefined : (
                  <AppTabBar
                    // The phone opens Artifacts from More (d-105).
                    selected={layout === 'tablet' ? 'artifacts' : 'more'}
                    device={layout === 'tablet' ? 'tablet' : 'phone'}
                    inboxBadge={data.railBadge}
                    onSelect={(next) => {
                      // M8: on the phone More opens the More drawer; the tablet's tabs navigate.
                      if (next === 'more' && layout === 'phone') onUiChange?.({ moreOpen: true })
                      else onNavigate?.(next)
                    }}
                  />
                )
              }
              list={
                open === undefined || discussing || layout !== 'desktop' ? undefined : (
                  <LibraryList data={data} ui={ui} selectedId={open.id} onUiChange={onUiChange} />
                )
              }
              detail={
                (open === undefined || view === undefined) && layout === 'phone' ? (
                  // M1: on a phone the library is a list of rows with small previews.
                  <LibraryPhone data={data} ui={ui} onUiChange={onUiChange} />
                ) : open === undefined || view === undefined ? (
                  <ArtifactsLibrary data={data} ui={ui} layout={layout} onUiChange={onUiChange} />
                ) : layout === 'tablet' && discussing && thread !== undefined ? (
                  <ArtifactDiscussionPage
                    {...thread}
                    artifact={view.artifact}
                    badge={view.badge}
                    onBack={closeDiscussion}
                  />
                ) : layout !== 'desktop' ? (
                  <ArtifactPage
                    artifact={view.artifact}
                    layout={layout}
                    badge={view.badge}
                    backLabel={data.title}
                    onBack={() => {
                      onUiChange?.({ artifactClosed: true })
                    }}
                    onDiscuss={
                      view.discussion === undefined
                        ? undefined
                        : () => {
                            onUiChange?.({ discussOpen: true })
                          }
                    }
                    // M2: the ⋯ button opens File in a project (M7).
                    onMore={() => {
                      onUiChange?.({ fileOpen: true })
                    }}
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
            {/* M7: File in a project, a sheet the phone's ⋯ button opens over the artifact. Picking a project checks
                it; Done, the scrim and Escape close it. Remove does nothing yet, as the desktop's Remove (D2). A wider
                screen has nothing that opens it yet (LIBRARY_GAPS.md, Project chip menu), but shows it when a state
                sets `fileOpen`, as a story at the width Storybook gives it does. */}
            {view === undefined || data.fileMenu === undefined ? undefined : (
              <FileSheet
                menu={data.fileMenu}
                artifactTitle={view.artifact.title}
                project={ui.fileProject ?? view.artifact.project}
                open={ui.fileOpen === true}
                onOpenChange={(fileOpen) => {
                  onUiChange?.({ fileOpen })
                }}
                onProjectChange={(fileProject) => {
                  onUiChange?.({ fileProject })
                }}
              />
            )}
            {/* M8: the shared More drawer, Artifacts selected with its count. Only the phone's More opens it; a state
                with `moreOpen` shows it at any width, as a story at the width Storybook gives it does. */}
            <MoreDrawer
              open={ui.moreOpen === true}
              onOpenChange={(moreOpen) => {
                onUiChange?.({ moreOpen })
              }}
              selected="artifacts"
              counts={{ artifacts: data.count }}
              onNavigate={onNavigate}
            />
          </Backdrop>
        )
      }}
    </ViewportFrame>
  )
}
