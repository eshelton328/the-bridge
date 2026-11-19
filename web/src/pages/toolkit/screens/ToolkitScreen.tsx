// The Toolkit page as one props-only screen, laid out by the width it gets
// (ViewportFrame): on the desktop the rail and the list beside it; on a
// tablet or phone the list full width over the tab bar, which opens
// Toolkit from More (d-105). The list (Figma D1 425:9) is the header, the
// kind chips, the search row and a group of cards per kind, narrowed by
// the chip and the search (`listView`). The Map view (D2) shows the map
// (`ToolkitMap`) under the same rows in place of the groups; on a tablet
// (T2) under the chips, with no search row; on the phone (M11) straight under
// the header, with no chips and no search. A state file's data and ui are its
// props; the callbacks are optional, so a story or a canvas board needs none:
// without `onUiChange` the screen keeps Erik's changes itself. A click on a
// card, a row or the map card's Open button opens the item (`ui.open`, D3):
// on the desktop the list moves into the list pane (`ToolkitListPane`) and
// the item (`ToolkitItem`) fills the rest; on a tablet or phone (T3) the item
// replaces the list, in the shared DetailFrame under its back row. An item
// opened from another item's links records it (`ui.from`, T7), and the back
// row shows the breadcrumb back to it. A workflow opened with Open full page
// (D13, `ui.flowFullPage`) fills the page without the list on every layout,
// under the breadcrumb Toolkit › Workflows › the workflow (`flowView`).
// The Activity view (D11, `ui.view` activity with `data.activity`) is
// `ToolkitActivityPage`: in the list's place on the desktop and the phone, a
// page of its own on a tablet (T9). A tap on a run opens it (`ui.run`, D12):
// beside the view in the side slot on the desktop, on a page of its own on a
// tablet or phone; a Most called item opens on its page (`activityPage`).
// Chats and Headless runs (D15, D16) add their own list: a chat's row opens
// the chat (`ui.chat`, D18) as a run opens, and an item, an eval's chip or
// an eval's row opens on its page (`activitySources`).
import { AppShell, Backdrop, Container, FilterChips } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { ToolkitGroup } from '../blocks/ToolkitGroup.tsx'
import { ToolkitHeader } from '../blocks/ToolkitHeader.tsx'
import { ToolkitItem } from '../blocks/ToolkitItem.tsx'
import { ToolkitListPane } from '../blocks/ToolkitListPane.tsx'
import { ToolkitListTools } from '../blocks/ToolkitListTools.tsx'
import { ToolkitMap } from '../blocks/ToolkitMap.tsx'
import { ToolkitKindChip, type ToolkitData, type ToolkitKind, type ToolkitUi } from '../types.ts'
import { canOpenFullPage, isFullPage, leaveFullPage, openFullPage } from './flowView.ts'
import { backTo, openedFrom, openFile, openFrom, openItem, showOnMap } from './itemView.ts'
import { listView, mapView } from './listView.ts'
import { openEvals } from '../blocks/evalsView.ts'
import { selectFile } from '../blocks/filesView.ts'
import { ToolkitDiscussPage } from '../blocks/ToolkitDiscussPage.tsx'
import { ToolkitDiscussPanel } from '../blocks/ToolkitDiscussPanel.tsx'
import { activityCounts, changeView, closeRun, openCalled, openRun, showRun } from '../blocks/activityPage.ts'
import { ToolkitActivityPage } from '../blocks/ToolkitActivityPage.tsx'
import { ToolkitRunPage } from '../blocks/ToolkitRunPage.tsx'
import { ToolkitRunPanel } from '../blocks/ToolkitRunPanel.tsx'
import { changeSource, closeChat, openChat, openEvalGroup, showAllRows, showChat } from '../blocks/activitySources.ts'
import { ToolkitChatPage } from '../blocks/ToolkitChatPage.tsx'
import { ToolkitChatPanel } from '../blocks/ToolkitChatPanel.tsx'
import {
  closeDiscuss,
  discussEntries,
  discussionOf,
  openDiscussion,
  sendDiscuss,
  toggleDiscuss,
  withDiscussReset,
} from './discussView.ts'

// D1 425:9: on the desktop the page is the library's `Container size="page"`: the list starts 32 in from the rail and
// 24 down, 1448 wide with 1384 of content in the 1512 px frame, and from `shell.detailWideFrom` at most 1448 wide in the
// middle of the detail. Its rows are 12 apart.
const page = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '24', pt: '12', pb: '20' }),
  // M1 429:50: 12 in from the sides, 4 under the status bar, and its rows 10 apart.
  phone: css({ display: 'flex', flexDirection: 'column', gap: '10', px: '12', pt: '4', pb: '12' }),
}
// D2 426:53: on the map the page runs to the foot of the window, below the map canvas.
const fullHeight = css({ flexGrow: '1' })
// Figma 425:32: the chip row is as wide as its chips.
const chips = css({ alignSelf: 'flex-start', maxW: '[100%]' })

export type ToolkitScreenProps = {
  data: ToolkitData
  ui: ToolkitUi
  /** The layout before the screen measures its width; after that the width picks it. */
  viewport: Viewport
  onNavigate?: ((page: string) => void) | undefined
  /** Reports what Erik changes: the view, the kind chip, the search or a group opened or closed. */
  onUiChange?: ((change: Partial<ToolkitUi>) => void) | undefined
  /** Copies an open item's path, from its path badge. */
  onCopyPath?: ((path: string) => void) | undefined
  /** Copies an answer of the item's discussion, from its Copy button (D5). */
  onCopyText?: ((text: string) => void) | undefined
}

type ToolkitLayoutProps = Omit<ToolkitScreenProps, 'viewport' | 'onUiChange'> & {
  layout: Viewport
  onUiChange: (change: Partial<ToolkitUi>) => void
}

function ToolkitLayout({
  data,
  ui,
  layout,
  onNavigate,
  onUiChange: report,
  onCopyPath,
  onCopyText,
}: ToolkitLayoutProps) {
  // Opening another item, or none, closes the discussion (D5, T5, M7).
  const onUiChange = (change: Partial<ToolkitUi>) => {
    report(withDiscussReset(ui, change))
  }
  const desktop = layout === 'desktop'
  const view = listView(data, ui)
  const open = openItem(data, ui)
  // The item's discussion (D5): beside the item on the desktop, in its place on a tablet or phone (T5, M7).
  const discussion = openDiscussion(open, ui, layout)
  const thread =
    discussion === undefined || open === null
      ? undefined
      : {
          discussion,
          entries: discussEntries(discussion, ui),
          draft: ui.discussDraft ?? '',
          onDraftChange: (discussDraft: string) => {
            onUiChange({ discussDraft })
          },
          onSend: (text: string) => {
            onUiChange(sendDiscuss(ui, text))
          },
          onCopy: onCopyText,
        }
  const closeDiscussion = () => {
    onUiChange(closeDiscuss())
  }
  const openPath = (path: string) => {
    onUiChange(openFrom(path))
  }
  const from = openedFrom(data, ui)
  const full = isFullPage(open, ui)
  const kindGroup = open === null ? undefined : data.groups.find((g) => g.kind === open.item.kind)
  const map = ui.view === 'map'
  // M11 461:709: the phone's map comes straight under the header; T2 428:348: the tablet's under the chips.
  const showChips = !(map && layout === 'phone')
  const showTools = !map || desktop
  const setGroupOpen = (kind: ToolkitKind, isOpen: boolean) => {
    onUiChange({ groupsOpen: { ...ui.groupsOpen, [kind]: isOpen } })
  }
  const kindChips = (
    <div className={chips} data-figma="filter · chips">
      <FilterChips
        padding="none"
        label="Filter by kind"
        multiple={false}
        items={data.chips.map((c) => ({
          value: c.value,
          label: c.label,
          count: c.count,
          kind: c.value === 'all' ? undefined : c.value,
        }))}
        value={[ui.filter]}
        onValueChange={(value) => {
          const parsed = ToolkitKindChip.shape.value.safeParse(value[0])
          if (parsed.success) onUiChange({ filter: parsed.data })
        }}
      />
    </div>
  )
  // D11: the Activity view, when nothing is open; D12: the run open in it.
  const activity = ui.view === 'activity' && open === null ? data.activity : undefined
  const running = activity === undefined ? undefined : activityCounts(activity, ui)?.running
  const run = activity === undefined ? null : openRun(activity, ui)
  const chat = activity === undefined ? null : openChat(activity, ui)
  const chatList = activity === undefined ? undefined : activityCounts(activity, ui)?.list
  const openSession = chatList?.type === 'chats' ? chatList.openSession : undefined
  const activityPage =
    activity === undefined ? null : (
      <ToolkitActivityPage
        view={activity}
        ui={ui}
        layout={layout}
        header={
          <ToolkitHeader
            count={data.count}
            view={ui.view}
            layout={layout}
            source={activity.readFrom}
            layer={desktop ? (run?.detail?.layers?.pageHeader ?? chat?.detail?.layers?.pageHeader) : undefined}
            onViewChange={(next) => {
              onUiChange(changeView(next))
            }}
          />
        }
        chips={kindChips}
        onSourceChange={(activitySource) => {
          onUiChange(changeSource(activitySource))
        }}
        onShowAll={() => {
          onUiChange(showAllRows())
        }}
        onOpenChat={(id) => {
          onUiChange(showChat(id))
        }}
        onOpenEvals={(path) => {
          onUiChange(openEvalGroup(path))
        }}
        onOpenRun={(id) => {
          onUiChange(showRun(id))
        }}
        onOpenItem={(path) => {
          onUiChange(openCalled(path))
        }}
        onBack={() => {
          onUiChange(changeView('list'))
        }}
      />
    )
  const runPage =
    run === null || running === undefined || desktop || activity === undefined ? null : (
      <ToolkitRunPage
        run={run}
        layout={layout}
        backLabel={activity.title}
        status={running.status}
        openSession={running.openSession}
        onBack={() => {
          onUiChange(closeRun())
        }}
      />
    )
  const chatPage =
    chat === null || openSession === undefined || desktop || activity === undefined ? null : (
      <ToolkitChatPage
        chat={chat}
        layout={layout}
        backLabel={activity.title}
        source={activity.sources.find((s) => s.value === 'chats')?.label ?? activity.title}
        openSession={openSession}
        onBack={() => {
          onUiChange(closeChat())
        }}
        onOpenItem={(path) => {
          onUiChange(openCalled(path))
        }}
      />
    )
  const listSection = (
    <section
      aria-label="Toolkit"
      className={ui.view === 'map' ? cx(page[layout], fullHeight) : page[layout]}
      data-figma={desktop ? undefined : 'toolkit'}
    >
      <ToolkitHeader
        count={data.count}
        view={ui.view}
        layout={layout}
        onViewChange={(next) => {
          onUiChange(changeView(next))
        }}
      />
      {showChips ? kindChips : null}
      {showTools ? (
        <ToolkitListTools
          query={ui.query}
          layout={layout}
          view={ui.view}
          onQueryChange={(query) => {
            onUiChange({ query })
          }}
        />
      ) : null}
      {ui.view === 'map' ? (
        <ToolkitMap
          map={mapView(data.map ?? { columns: [], nodes: [], links: [] }, ui)}
          selected={ui.mapSelected ?? null}
          layout={layout}
          selectedItem={data.groups.flatMap((g) => g.items).find((item) => item.path === ui.mapSelected)}
          onSelect={(path) => {
            onUiChange({ mapSelected: path })
          }}
          onOpen={openPath}
        />
      ) : null}
      {(ui.view === 'map' ? [] : view.groups).map((group) => (
        <ToolkitGroup
          key={group.kind}
          group={group}
          layout={layout}
          sharedNames={view.sharedNames}
          open={ui.groupsOpen[group.kind] ?? true}
          onOpenChange={(next) => {
            setGroupOpen(group.kind, next)
          }}
          onOpen={openPath}
        />
      ))}
    </section>
  )
  // On the desktop the Container is the page Figma names `toolkit`, padding included.
  const list = desktop ? (
    <Container size="page" className={ui.view === 'map' ? fullHeight : undefined} data-figma="toolkit">
      {listSection}
    </Container>
  ) : (
    listSection
  )
  const item =
    open === null ? null : (
      <ToolkitItem
        open={open}
        layout={layout}
        back={
          full
            ? () => {
                onUiChange(leaveFullPage())
              }
            : desktop
              ? undefined
              : () => {
                  onUiChange(backTo(null))
                }
        }
        from={
          from === null
            ? null
            : {
                name: from.name,
                onOpen: () => {
                  onUiChange(backTo(from.path))
                },
              }
        }
        onTabChange={(itemTab) => {
          onUiChange({ itemTab })
        }}
        file={ui.file}
        onFileChange={(file) => {
          // Another file opens on its default view: Explain for a script with an explanation (D10). On a tablet or
          // phone that script opens on a page of its own (T6); on the phone every file with a view does (M5).
          const browser = open.detail.browser
          onUiChange(
            browser === undefined
              ? { file, fileView: undefined, line: undefined }
              : selectFile(browser, file, !desktop, layout === 'phone'),
          )
        }}
        filePage={ui.filePage}
        onCloseFilePage={() => {
          onUiChange({ filePage: undefined, fileView: undefined, line: undefined })
        }}
        fileView={ui.fileView}
        onFileViewChange={(fileView) => {
          // Another view of the file shows it whole, from its first line, not at a link's line.
          onUiChange({ fileView, line: undefined })
        }}
        line={ui.line}
        onCopyPath={onCopyPath}
        onDiscuss={
          discussionOf(open, layout) === undefined
            ? undefined
            : () => {
                onUiChange(toggleDiscuss(ui, layout))
              }
        }
        layers={discussion?.itemLayers}
        onShowOnMap={() => {
          // From the full page, Show on map leaves it as a crumb does, so the workflow reopened from the map starts on its
          // Overview.
          onUiChange(full ? { ...leaveFullPage(), ...showOnMap(open.item.path) } : showOnMap(open.item.path))
        }}
        // Only an item with a page of its own opens it, so Open full page never lands on an empty tab.
        onOpenFullPage={
          canOpenFullPage(open)
            ? () => {
                onUiChange(openFullPage())
              }
            : undefined
        }
        fullPage={
          full
            ? {
                crumb: {
                  name: kindGroup?.label ?? open.item.kind,
                  onOpen: () => {
                    onUiChange(leaveFullPage(open.item.kind))
                  },
                },
                selectedStep: ui.flowStep,
                onSelectStep: (flowStep) => {
                  onUiChange({ flowStep })
                },
              }
            : undefined
        }
        onOpenItem={(path) => {
          onUiChange(openFrom(path, open.item.path))
        }}
        onOpenEvals={(path) => {
          onUiChange(openEvals(path, open.item.path))
        }}
        onOpenFile={(path, file, line) => {
          // The file opens as a tap on its row in the tree opens it: on a tablet or phone on its own page when it has
          // one (selectFile; on the phone every file with a view does, since its Files tab has no viewer).
          const browser = openItem(data, { open: path, itemTab: 'files' })?.detail.browser
          const page =
            browser !== undefined && selectFile(browser, file, !desktop, layout === 'phone').filePage === true
          onUiChange(openFile(path, file, open.item.path, { page, line }))
        }}
      />
    )
  return (
    <Backdrop size={layout}>
      <AppShell
        size={layout}
        view="detail"
        rail={desktop ? <AppRail selected="toolkit" inboxBadge={data.railBadge} onSelect={onNavigate} /> : undefined}
        tabBarOverlay
        // T5, M7: the discussion's page has no tab bar, as the Artifacts discussion's (T4, M9 there).
        tabBar={
          desktop || thread !== undefined ? undefined : (
            <AppTabBar
              selected="more"
              device={layout === 'tablet' ? 'tablet' : 'phone'}
              inboxBadge={data.railBadge}
              onSelect={(next) => {
                // On the phone More opens the drawer; the tablet's More stays the page's way to Toolkit (d-105).
                if (next === 'more' && layout === 'phone') onUiChange({ moreOpen: true })
                else onNavigate?.(next)
              }}
            />
          )
        }
        // D5: the discussion takes the list's place, beside the item at the window's end.
        sideWidth="wide"
        side={
          desktop && thread !== undefined && open !== null ? (
            <ToolkitDiscussPanel {...thread} itemName={open.item.name} onClose={closeDiscussion} />
          ) : desktop && chat !== null && openSession !== undefined ? (
            <ToolkitChatPanel
              chat={chat}
              openSession={openSession}
              onClose={() => {
                onUiChange(closeChat())
              }}
              onOpenItem={(path) => {
                onUiChange(openCalled(path))
              }}
            />
          ) : desktop && run !== null && running !== undefined ? (
            <ToolkitRunPanel
              run={run}
              status={running.status}
              openSession={running.openSession}
              onClose={() => {
                onUiChange(closeRun())
              }}
            />
          ) : undefined
        }
        list={
          item !== null && desktop && !full && thread === undefined ? (
            <ToolkitListPane
              data={data}
              ui={ui}
              groups={view.groups}
              sharedNames={view.sharedNames}
              onUiChange={onUiChange}
            />
          ) : undefined
        }
        detail={
          !desktop && thread !== undefined && open !== null ? (
            <ToolkitDiscussPage
              {...thread}
              layout={layout}
              item={{ name: open.item.name, kind: thread.discussion.card.kind }}
              onBack={closeDiscussion}
            />
          ) : (
            (item ?? runPage ?? chatPage ?? activityPage ?? list)
          )
        }
      />
      {/* Only the phone's More opens it; a state with `moreOpen` (M4) shows it at any width, as a story renders it. */}
      <MoreDrawer
        open={ui.moreOpen === true}
        onOpenChange={(open) => {
          onUiChange({ moreOpen: open })
        }}
        selected="toolkit"
        counts={{ artifacts: data.artifactsCount, toolkit: data.count }}
        onNavigate={onNavigate}
      />
    </Backdrop>
  )
}

type Changed = { of: ToolkitUi; ui: Partial<ToolkitUi> }

export function ToolkitScreen({ viewport, ui, onUiChange, ...props }: ToolkitScreenProps) {
  // What Erik changes lives above the layout, so a width change keeps it; another state starts from its own ui.
  const [changed, setChanged] = useState<Changed>({ of: ui, ui: {} })
  const own = onUiChange === undefined && changed.of === ui ? changed.ui : {}
  const report =
    onUiChange ??
    ((change: Partial<ToolkitUi>) => {
      setChanged({ of: ui, ui: { ...own, ...change } })
    })
  return (
    <ViewportFrame initial={viewport}>
      {(layout) => <ToolkitLayout layout={layout} ui={{ ...ui, ...own }} onUiChange={report} {...props} />}
    </ViewportFrame>
  )
}
