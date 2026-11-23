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
// it as a sheet (M7), and whose Discuss opens the discussion as a page of its
// own with no tab bar, as on a tablet (M9); the phone's More opens the shared
// More drawer over the tab bar (M8). A card or row of the library opens its
// artifact the same way (`ui.openId`, openView.ts). A state file's data and ui are its props; the
// callbacks are optional, so a story or a canvas board needs none. On the live library the entry passes
// `onAddLink`, `onFile` and `onRemove`, which send the owner's Add, project pick and Remove to the server, and
// `notice`, the line of the last one that missed.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { reportShellDiagnostic } from '../../../errors/shellDiagnostic.ts'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import { defaultVisiblePages, type BarPage, navLayout } from '../../../lib/deviceSettings.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import type { AddLinkInput, ArtifactsData, ArtifactsNotice, ArtifactsUi, CopiedLink } from '../types.ts'
import type { ProposalAct } from '../blocks/ArtifactProposal.tsx'
import { DiscussionPanel } from '../blocks/DiscussionPanel.tsx'
import { FileSheet } from '../blocks/FileSheet.tsx'
import { ArtifactDetail } from './ArtifactDetail.tsx'
import { ArtifactDiscussionPage } from './ArtifactDiscussionPage.tsx'
import { ArtifactPage } from './ArtifactPage.tsx'
import { ArtifactsLibrary } from './ArtifactsLibrary.tsx'
import { addLinkInput } from './addLinkView.ts'
import { appliedView, discussionEntries, proposalEffect } from './discussionView.ts'
import { LibraryList } from './LibraryList.tsx'
import { LibraryPhone } from './LibraryPhone.tsx'
import { artifactHref, filedProject, openArtifact } from './openView.ts'

export type ArtifactsScreenProps = {
  /** Draws the Settings gear in the rail and the Settings row in the More drawer (d-119): the page entry passes it; a Figma state does not. */
  settingsEntry?: boolean | undefined
  data: ArtifactsData
  ui: ArtifactsUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** The shown nav pages in the owner's order (d-038, d-119); the default order without it, as the Figma states draw. */
  navPages?: readonly BarPage[] | undefined
  /** Reports what the owner changes: the chip, the search, the view and the open groups. */
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  /** Copy link on an open artifact was pressed (D2, T2, M2), with the address its link opens. */
  onCopyLink?: ((link: string) => void) | undefined
  /** The last Copy link's result, which the open artifact's Copy link shows while its link is the one copied. */
  copiedLink?: CopiedLink | undefined
  /** Add a link's Add was pressed, with what it sends (the live library); without it Add only closes the form. */
  onAddLink?: ((input: AddLinkInput) => void) | undefined
  /** A project was picked for the artifact `id`, or `noProject` (the live library). */
  onFile?: ((id: string, project: string) => void) | undefined
  /** Remove was pressed on the artifact `id` (the live library); without it Remove does nothing. */
  onRemove?: ((id: string) => void) | undefined
  /** The line of the last write that missed: under Add a link's link field, or in the artifact's status line. */
  notice?: ArtifactsNotice | undefined
  /** While the route loads (R58): the library's real layout with its counts gone, its controls off and cards that load. */
  loading?: boolean | undefined
}

export function ArtifactsScreen({
  data,
  ui,
  viewport,
  onNavigate,
  settingsEntry,
  navPages = defaultVisiblePages,
  onUiChange,
  onCopyLink,
  copiedLink,
  onAddLink,
  onFile,
  onRemove,
  notice,
  loading,
}: ArtifactsScreenProps) {
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => {
        // D2: the desktop opens an artifact beside the list; T2 and M2: a tablet or phone on its own page, until Back
        // closes it.
        // A card or row opened from the library (`ui.openId`) opens the same way (openView.ts).
        const open = openArtifact(data, ui, layout)
        // D9: after Apply the artifact shows Updated and the proposal its applied form.
        const applied = open === undefined ? undefined : appliedView(open.artifact, open.discussion, ui)
        // The live library's write that missed for this artifact says so in its status line.
        const view =
          applied !== undefined && notice?.at === 'artifact' && notice.id === applied.artifact.id
            ? { ...applied, artifact: { ...applied.artifact, found: notice.text } }
            : applied
        // D2, T2: the project chip opens the project menu; picking a project files the artifact in it, as M7's sheet.
        const projectMenu =
          view === undefined || data.fileMenu === undefined
            ? undefined
            : {
                menu: data.fileMenu,
                value: filedProject(ui, data.open?.id, view.artifact),
                onValueChange: (fileProject: string) => {
                  onUiChange?.({ fileProject, fileFor: view.artifact.id })
                  onFile?.(view.artifact.id, fileProject)
                },
              }
        // D2, T2, M2: Open artifact links to the https address the artifact's link opens, and Copy link copies it; a
        // link that is not an https address has neither (artifactHref).
        const href = view === undefined ? undefined : artifactHref(view.artifact.link)
        const copyLink =
          href === undefined || onCopyLink === undefined
            ? undefined
            : () => {
                onCopyLink(href)
              }
        // "Copied" or "Copy failed" shows only on the artifact whose link was copied.
        const copyLinkStatus = href !== undefined && copiedLink?.link === href ? copiedLink.status : undefined
        // D1, T1, M1 and D2's list: a card or row opens its artifact; Back closes it again on a tablet or phone.
        const openCard = (openId: string) => {
          onUiChange?.({ openId, artifactClosed: false })
        }
        // D7: Discuss opens the artifact's discussion beside it, and the list closes. T4 and M9: on a tablet or phone
        // it opens as a page of its own, and the tab bar hides.
        const discussion = view?.discussion
        const discussing = discussion !== undefined && ui.discussOpen === true
        const sent = ui.discussSent ?? []
        // What the desktop panel and the tablet page share: the draft, the entries and where the owner's presses go.
        const thread =
          discussion === undefined || view === undefined
            ? undefined
            : {
                discussion,
                draft: ui.discussDraft,
                entries: discussionEntries(discussion, ui),
                applied: view.applied,
                // T5: on the tablet's or phone's page Apply returns to the artifact's page, which shows Updated.
                onAct: (act: ProposalAct) => {
                  onUiChange?.(proposalEffect(discussion, act, layout === 'desktop' ? 'panel' : 'page'))
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
        const remove =
          view === undefined || onRemove === undefined
            ? undefined
            : () => {
                onRemove(view.artifact.id)
              }
        // Add a link's Add sends what the form holds (the live library); the miss's line shows under the link.
        const addLinkForm = layout === 'phone' ? (data.addLinkSheet ?? data.addLinkForm) : data.addLinkForm
        const submitAddLink =
          onAddLink === undefined || addLinkForm === undefined
            ? undefined
            : () => {
                onAddLink(addLinkInput(addLinkForm, ui))
              }
        const addLinkError = notice?.at === 'addLink' ? notice.text : undefined
        const closeDiscussion = () => {
          onUiChange?.({ discussOpen: false })
        }
        const nav = navLayout(navPages, layout)
        return (
          <Backdrop size={layout}>
            <AppShell
              onDiagnostic={reportShellDiagnostic}
              size={layout}
              rail={
                layout === 'desktop' ? (
                  <AppRail
                    settings={settingsEntry}
                    selected="artifacts"
                    pages={nav.rail}
                    inboxBadge={data.railBadge}
                    onSelect={onNavigate}
                  />
                ) : undefined
              }
              // The library and the artifact's page on a tablet or phone (T2, M2) run under the tab bar, as Figma draws them; their
              // end scrolls clear of it (ArtifactsStickyBars.test.tsx, PhoneTabBar.test.tsx).
              tabBarOverlay
              tabBar={
                layout === 'desktop' || discussing ? undefined : (
                  <AppTabBar
                    // A page the tab bar does not show selects More: the phone opens Artifacts from More (d-105).
                    selected="artifacts"
                    pages={nav.tabs}
                    more={nav.more.length > 0}
                    device={layout === 'tablet' ? 'tablet' : 'phone'}
                    inboxBadge={data.railBadge}
                    onSelect={(next) => {
                      // M8: on the phone More opens the More drawer; the tablet's tabs navigate.
                      if (next === 'more') onUiChange?.({ moreOpen: true })
                      else onNavigate?.(next)
                    }}
                  />
                )
              }
              list={
                open === undefined || discussing || layout !== 'desktop' ? undefined : (
                  <LibraryList
                    data={data}
                    ui={ui}
                    selectedId={open.artifact.id}
                    onUiChange={onUiChange}
                    onOpenArtifact={openCard}
                    onSubmitAddLink={submitAddLink}
                    addLinkError={addLinkError}
                  />
                )
              }
              detail={
                (open === undefined || view === undefined) && layout === 'phone' ? (
                  // M1: on a phone the library is a list of rows with small previews.
                  <LibraryPhone
                    data={data}
                    ui={ui}
                    onUiChange={onUiChange}
                    onOpenArtifact={openCard}
                    onSubmitAddLink={submitAddLink}
                    addLinkError={addLinkError}
                    loading={loading}
                  />
                ) : open === undefined || view === undefined ? (
                  <ArtifactsLibrary
                    data={data}
                    ui={ui}
                    layout={layout}
                    onUiChange={onUiChange}
                    onOpenArtifact={openCard}
                    onSubmitAddLink={submitAddLink}
                    addLinkError={addLinkError}
                    loading={loading}
                  />
                ) : layout !== 'desktop' && discussing && thread !== undefined ? (
                  <ArtifactDiscussionPage
                    {...thread}
                    layout={layout}
                    artifact={view.artifact}
                    badge={view.badge}
                    onBack={closeDiscussion}
                  />
                ) : layout !== 'desktop' ? (
                  <ArtifactPage
                    artifact={view.artifact}
                    href={href}
                    layout={layout}
                    badge={view.badge}
                    backLabel={data.title}
                    projectMenu={projectMenu}
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
                    onCopyLink={copyLink}
                    copyLinkStatus={copyLinkStatus}
                    // M2: the ⋯ button opens File in a project (M7).
                    onMore={() => {
                      onUiChange?.({ fileOpen: true })
                    }}
                    onRemove={remove}
                  />
                ) : (
                  <ArtifactDetail
                    artifact={view.artifact}
                    href={href}
                    badge={view.badge}
                    onDiscuss={
                      discussion === undefined
                        ? undefined
                        : () => {
                            onUiChange?.({ discussOpen: !discussing })
                          }
                    }
                    onCopyLink={copyLink}
                    copyLinkStatus={copyLinkStatus}
                    madeInLayer={discussion?.layers.madeIn}
                    projectMenu={projectMenu}
                    onRemove={remove}
                    side={
                      discussing && thread !== undefined ? (
                        <DiscussionPanel {...thread} artifactId={view.artifact.id} onClose={closeDiscussion} />
                      ) : undefined
                    }
                  />
                )
              }
            />
            {/* M7: File in a project, a sheet the phone's ⋯ button opens over the artifact. Picking a project checks
                it; Done, the scrim and Escape close it. Remove (and the desktop's, D2) goes to `onRemove`. A wider
                screen opens the project menu from the project chip instead, but shows this sheet when a state
                sets `fileOpen`, as a story at the width Storybook gives it does. */}
            {view === undefined || data.fileMenu === undefined ? undefined : (
              <FileSheet
                menu={data.fileMenu}
                artifactTitle={view.artifact.title}
                project={filedProject(ui, data.open?.id, view.artifact)}
                open={ui.fileOpen === true}
                onOpenChange={(fileOpen) => {
                  onUiChange?.({ fileOpen })
                }}
                onProjectChange={(fileProject) => {
                  onUiChange?.({ fileProject, fileFor: view.artifact.id })
                  onFile?.(view.artifact.id, fileProject)
                }}
                notice={notice?.at === 'artifact' && notice.id === view.artifact.id ? notice.text : undefined}
                onRemove={
                  onRemove === undefined
                    ? undefined
                    : () => {
                        onRemove(view.artifact.id)
                      }
                }
              />
            )}
            {/* M8: the shared More drawer, Artifacts selected with its count. The phone's and the tablet's More open it
                (d-119); a state with `moreOpen` shows it at any width, as a story at the width Storybook gives it does. */}
            <MoreDrawer
              settings={settingsEntry}
              open={ui.moreOpen === true}
              onOpenChange={(moreOpen) => {
                onUiChange?.({ moreOpen })
              }}
              pages={navLayout(navPages, layout === 'tablet' ? 'tablet' : 'phone').more}
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
