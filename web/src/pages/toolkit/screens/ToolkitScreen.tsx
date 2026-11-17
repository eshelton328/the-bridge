// The Toolkit page as one props-only screen, laid out by the width it gets
// (ViewportFrame): on the desktop the rail and the list beside it; on a
// tablet or phone the list full width over the tab bar, which opens
// Toolkit from More (d-105). The list (Figma D1 425:9) is the header, the
// kind chips, the search row and a group of cards per kind, narrowed by
// the chip and the search (`listView`). A state file's data and ui are its
// props; the callbacks are optional, so a story or a canvas board needs none:
// without `onUiChange` the screen keeps Erik's changes itself.
import { AppShell, Backdrop, FilterChips } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { AppRail } from '../../../blocks/AppRail.tsx'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { ViewportFrame } from '../../../blocks/ViewportFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { ToolkitGroup } from '../blocks/ToolkitGroup.tsx'
import { ToolkitHeader } from '../blocks/ToolkitHeader.tsx'
import { ToolkitListTools } from '../blocks/ToolkitListTools.tsx'
import { ToolkitKindChip, type ToolkitData, type ToolkitKind, type ToolkitUi } from '../types.ts'
import { listView } from './listView.ts'

// D1 425:9: the list starts 32 in from the rail and 24 down, and its rows are 12 apart.
const page = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '32', pt: '24', pb: '32' }),
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '12', px: '24', pt: '12', pb: '20' }),
  // M1 429:50: 12 in from the sides, 4 under the status bar, and its rows 10 apart.
  phone: css({ display: 'flex', flexDirection: 'column', gap: '10', px: '12', pt: '4', pb: '12' }),
}
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
}

type ToolkitLayoutProps = Omit<ToolkitScreenProps, 'viewport' | 'onUiChange'> & {
  layout: Viewport
  onUiChange: (change: Partial<ToolkitUi>) => void
}

function ToolkitLayout({ data, ui, layout, onNavigate, onUiChange }: ToolkitLayoutProps) {
  const desktop = layout === 'desktop'
  const view = listView(data, ui)
  const setGroupOpen = (kind: ToolkitKind, open: boolean) => {
    onUiChange({ groupsOpen: { ...ui.groupsOpen, [kind]: open } })
  }
  const list = (
    <section aria-label="Toolkit" className={page[layout]} data-figma="toolkit">
      <ToolkitHeader
        count={data.count}
        view={ui.view}
        layout={layout}
        onViewChange={(next) => {
          onUiChange({ view: next })
        }}
      />
      <div className={chips} data-figma="filter · chips">
        <FilterChips
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
      <ToolkitListTools
        query={ui.query}
        layout={layout}
        onQueryChange={(query) => {
          onUiChange({ query })
        }}
      />
      {view.groups.map((group) => (
        <ToolkitGroup
          key={group.kind}
          group={group}
          layout={layout}
          sharedNames={view.sharedNames}
          open={ui.groupsOpen[group.kind] ?? true}
          onOpenChange={(open) => {
            setGroupOpen(group.kind, open)
          }}
        />
      ))}
    </section>
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
              onSelect={onNavigate}
            />
          )
        }
        detail={list}
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
