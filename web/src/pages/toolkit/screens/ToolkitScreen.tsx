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
// the item (`ToolkitItem`) fills the rest; on a tablet or phone the item
// fills the screen under a back row.
import { AppShell, Backdrop, FilterChips } from '@eshelton328/component-library-1701'
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
import { openItem, showOnMap } from './itemView.ts'
import { listView, mapView } from './listView.ts'

// D1 425:9: the list starts 32 in from the rail and 24 down, and its rows are 12 apart.
const page = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '32', pt: '24', pb: '32' }),
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
}

type ToolkitLayoutProps = Omit<ToolkitScreenProps, 'viewport' | 'onUiChange'> & {
  layout: Viewport
  onUiChange: (change: Partial<ToolkitUi>) => void
}

function ToolkitLayout({ data, ui, layout, onNavigate, onUiChange, onCopyPath }: ToolkitLayoutProps) {
  const desktop = layout === 'desktop'
  const view = listView(data, ui)
  const open = openItem(data, ui)
  const openPath = (path: string) => {
    onUiChange({ open: path })
  }
  const map = ui.view === 'map'
  // M11 461:709: the phone's map comes straight under the header; T2 428:348: the tablet's under the chips.
  const showChips = !(map && layout === 'phone')
  const showTools = !map || desktop
  const setGroupOpen = (kind: ToolkitKind, isOpen: boolean) => {
    onUiChange({ groupsOpen: { ...ui.groupsOpen, [kind]: isOpen } })
  }
  const list = (
    <section
      aria-label="Toolkit"
      className={ui.view === 'map' ? cx(page[layout], fullHeight) : page[layout]}
      data-figma="toolkit"
    >
      <ToolkitHeader
        count={data.count}
        view={ui.view}
        layout={layout}
        onViewChange={(next) => {
          onUiChange({ view: next })
        }}
      />
      {showChips ? (
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
      ) : null}
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
  const item =
    open === null ? null : (
      <ToolkitItem
        open={open}
        back={
          desktop
            ? undefined
            : () => {
                onUiChange({ open: null })
              }
        }
        onTabChange={(itemTab) => {
          onUiChange({ itemTab })
        }}
        onCopyPath={onCopyPath}
        onShowOnMap={() => {
          onUiChange(showOnMap(open.item.path))
        }}
        onOpenFullPage={() => {
          // D13 shows the steps on a page of their own; until it is built the item stays as it is.
          onUiChange({ flowFullPage: true })
        }}
        onOpenItem={openPath}
      />
    )
  return (
    <Backdrop size={layout}>
      <AppShell
        size={layout}
        view="detail"
        rail={desktop ? <AppRail selected="toolkit" inboxBadge={data.railBadge} onSelect={onNavigate} /> : undefined}
        tabBar={
          desktop ? undefined : (
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
        list={
          item !== null && desktop ? (
            <ToolkitListPane
              data={data}
              ui={ui}
              groups={view.groups}
              sharedNames={view.sharedNames}
              onUiChange={onUiChange}
            />
          ) : undefined
        }
        detail={item ?? list}
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
