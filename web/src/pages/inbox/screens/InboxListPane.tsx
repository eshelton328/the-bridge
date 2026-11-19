// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows; with the sort by project, a heading
// per project in each group; with a search, a line that sums up the
// results and a hint about matches in Done, whose Show it selects the Done
// chip; with filters that apply, a row of them under the tools and how
// many tasks they hide; and a toast that
// sticks to the bottom of the list. On the tablet and phone (T1, T6, T7)
// the list fills the screen on the backdrop, with the page's large title.
// The rows and counts come from listView (the owner's sort, search, filters and
// snoozed items over the state's groups); the menus report through
// onUiChange. On a tablet or phone a tap on a row opens it: the state's
// item its detail, any other row its own page (R11); a long-press on a row
// opens its actions sheet (M6), which snoozes, marks done or dismisses it; a state with
// `ui.actionsFor` shows the sheet at any width. On the phone the chip row
// scrolls the selected chip into view (M12), and a sort other than the first
// shows a line under the tools with Reset (M15). Props only.
import {
  CheckIcon,
  Container,
  FilterChips,
  FolderIcon,
  GroupHeader,
  Inline,
  PageHeader,
  Stack,
  Toast,
} from '@eshelton328/component-library-1701'
import { useLayoutEffect, useRef } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { AppliedFilters } from '../blocks/AppliedFilters.tsx'
import { InboxRow } from '../blocks/InboxRow.tsx'
import { ListTools } from '../blocks/ListTools.tsx'
import { RowActionsSheet } from '../blocks/RowActionsSheet.tsx'
import type { InboxData, InboxGroupId, InboxGroupView, InboxPutAway, InboxUi } from '../types.ts'
import { allChecks, listView } from './listView.ts'

const pane = css({
  display: 'flex',
  flexDirection: 'column',
  // Figma 346:146 stacks the header, chips, tools and groups 2 apart; the header and tools rows carry their own padding.
  gap: '2',
  flex: '1',
  p: '12',
  pb: '0',
  overflow: 'auto',
  bg: 'surface.pane',
})
// The pane holds the scrolling list, and the toast sticks to the list's bottom (D18 403:2943: 12 px in,
// 16 px up). The list ends at the toast's bottom edge, so nothing shows in the 16 px under the toast, as
// in Figma, where the toast covers the last group header.
const frame = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  overflow: 'hidden',
  pb: '16',
  bg: 'surface.pane',
})
// The toast is the list's last child and sticks to its bottom: at rest it covers the end of the list, as
// in Figma, and at the bottom of the scroll it sits under the last group, so no row stays behind it.
// The top margin keeps it at the bottom when the list is short.
const toast = css({ position: 'sticky', bottom: '0', mt: 'auto' })
// On a tablet or phone the list fills the screen above the tab bar when it has a toast, so the toast sits at its
// bottom: 12 above the tab bar on the phone (M22 402:7589 to 402:7503, the Container's bottom padding) and 16 on the
// tablet (T21 402:12214, 20 with the Container's padding). Without the fill the toast followed the last group.
const compactFill = css({ flex: '1' })
// The tablet list (T1 346:5415) sits on the backdrop, with no pane fill; the Container pads it.
const compactPane = css({ display: 'flex', flexDirection: 'column', gap: '2' })
const header = css({ py: '4' })
// M1 346:9010: the phone's large title sits 4 in from the header's edge, over the group chevrons and the kind tiles.
const phoneHeader = css({ px: '4' })
const summary = css({ textStyle: 'small', color: 'fg.muted', alignSelf: 'flex-start' })
// M15 346:12164: "Sorted by project" and Reset, 4 in, under the tools.
const sortLine = css({ px: '4' })
const reset = css({
  textStyle: 'small',
  fontWeight: 'text.label',
  color: 'fg.accent',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
})
const showIt = css({ color: 'fg.accent', textDecoration: 'none', _hover: { textDecoration: 'underline' } })

function Rows({
  rows,
  selectedId,
  query,
  onSelectItem,
  onActions,
  openable,
  onOpenRow,
  phone,
}: {
  rows: InboxGroupView['rows']
  /** The row drawn selected: the open task's. */
  selectedId: string | null
  query: string | undefined
  onSelectItem: ((id: string) => void) | undefined
  /** The row that opens its detail: the item the state has a detail for. */
  openable: string | undefined
  /** Opens another row's own page on a tablet or phone (R11); the desktop has none. */
  onOpenRow: ((id: InboxGroupView['rows'][number]['id']) => void) | undefined
  onActions: ((id: InboxGroupView['rows'][number]['id']) => void) | undefined
  phone: boolean
}) {
  return rows.map((row) => (
    <InboxRow
      key={row.id}
      row={row}
      selected={row.id === selectedId}
      query={query}
      phone={phone}
      onSelect={
        row.id === openable
          ? onSelectItem === undefined
            ? undefined
            : () => {
                onSelectItem(row.id)
              }
          : onOpenRow === undefined
            ? undefined
            : () => {
                onOpenRow(row.id)
              }
      }
      // A finished row (in Done) has nothing left to snooze, mark done or dismiss, so it has no actions.
      onActions={
        onActions === undefined || row.outcome !== undefined
          ? undefined
          : () => {
              onActions(row.id)
            }
      }
    />
  ))
}

export type InboxListPaneProps = {
  data: InboxData
  ui: InboxUi
  /** The row drawn selected: the open task's (d-101). */
  selectedId: string | null
  /** The screen's layout: a pane beside the detail on the desktop, the whole screen on a tablet or phone. */
  layout?: Viewport | undefined
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
  /** A tap on a row the state has no detail for, on a tablet or phone: its own page (R11). */
  onOpenRow?: ((id: InboxGroupView['rows'][number]['id']) => void) | undefined
  /** Where the list was scrolled when the owner last opened a row from it; the list scrolls back there. */
  scrollTop?: number | undefined
  /** Reports the list's scroll as the owner opens a row, so Back returns to the same place. */
  onScrollSave?: ((top: number) => void) | undefined
  /** The text the owner typed in the search field; without it the field shows the state's query. */
  query?: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  /** Reports what the owner changes in the list: the sort, the filters and their menus. */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
  /** The toast's action, such as Undo, was pressed. */
  onToastAction?: (() => void) | undefined
  /** Snoozes a row, or marks it done or dismissed, from its actions sheet. */
  onPutAway?: InboxPutAway | undefined
}

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? '' : 's'}`

export function InboxListPane({
  data,
  ui,
  selectedId,
  layout = 'desktop',
  onFilterChange,
  onGroupOpenChange,
  onSelectItem: selectItem,
  onOpenRow: openRow,
  scrollTop,
  onScrollSave,
  query,
  onQueryChange,
  onUiChange,
  onToastAction,
  onPutAway,
}: InboxListPaneProps) {
  const desktop = layout === 'desktop'
  // On a tablet or phone the list fills the shell's scrolling detail (`main`), and an open row takes its place. The
  // list notes its scroll as a row opens and scrolls back there when Back shows it again.
  const sectionRef = useRef<HTMLElement>(null)
  const leave = () => {
    const scroller = sectionRef.current?.closest('main')
    if (!desktop && scroller != null) onScrollSave?.(scroller.scrollTop)
  }
  const onSelectItem =
    selectItem === undefined
      ? undefined
      : (id: string) => {
          leave()
          selectItem(id)
        }
  const onOpenRow =
    desktop || openRow === undefined
      ? undefined
      : (id: InboxGroupView['rows'][number]['id']) => {
          leave()
          openRow(id)
        }
  // A long press or the context menu on a row opens its actions sheet on a tablet or phone (M6, R11).
  const onActions = !desktop
    ? (id: InboxGroupView['rows'][number]['id']) => {
        onUiChange?.({ actionsFor: id })
      }
    : undefined
  const q = query ?? data.search?.query ?? ''
  const view = listView(data, ui, q)
  const marked = q.trim() === '' ? undefined : q
  // The hint about matches in Done belongs to the state's own search; under the Done chip the matches show.
  const more = data.search?.query === q && ui.filter !== 'done' ? data.search.more : undefined
  // While the Filter menu is open it shows the filters; the applied row, the count on Filter and the hidden line wait.
  const applied = ui.filterOpen ? [] : view.applied
  // The chip row scrolls sideways on the phone; the selected chip scrolls into view, as a tap on it does (M12).
  const chipsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    chipsRef.current?.querySelector('[data-state="on"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [ui.filter])
  // After the chip row's own scroll into view, so the list ends where the owner left it.
  useLayoutEffect(() => {
    const scroller = sectionRef.current?.closest('main')
    if (!desktop && scroller != null && scrollTop !== undefined) scroller.scrollTop = scrollTop
  }, [desktop, scrollTop])
  const sortFirst = data.sortMenu.options[0]
  const sorted = data.sortMenu.options.find((o) => o.value === ui.sort)
  const setFilters = (filters: string[]) => {
    onUiChange?.({ filters, filterChecks: filters })
  }
  const list = (
    <section
      ref={sectionRef}
      aria-label="Inbox list"
      className={desktop ? pane : cx(compactPane, data.toast === undefined ? undefined : compactFill)}
      data-figma={data.toast === undefined ? 'inbox list' : undefined}
    >
      <div className={desktop ? header : layout === 'phone' ? phoneHeader : undefined} data-figma="header">
        <PageHeader
          size={desktop ? 'pane' : 'phone'}
          title="Inbox"
          count={view.count}
          countLabel={plural(view.count, 'task')}
          level={desktop ? 2 : 1}
        />
      </div>
      <div data-figma="filter · chips" ref={chipsRef}>
        <FilterChips
          label="Filter the inbox"
          items={view.filters}
          value={[ui.filter]}
          multiple={false}
          // M1 346:9014: the phone's chips pad their label 12 at the sides (`phone`); the desktop and tablet keep 8.
          size={layout === 'phone' ? 'phone' : 'compact'}
          onValueChange={(values) => {
            const [first] = values
            if (first !== undefined) onFilterChange?.(first)
          }}
        />
      </div>
      <ListTools
        sortMenu={data.sortMenu}
        sort={ui.sort}
        sortOpen={ui.sortOpen}
        onSortOpenChange={(sortOpen) => {
          onUiChange?.({ sortOpen })
        }}
        onSortChange={(sort, close) => {
          onUiChange?.(close ? { sort, sortOpen: false } : { sort })
        }}
        query={q}
        onQueryChange={onQueryChange}
        filterMenu={data.filterMenu}
        filterChecks={ui.filterChecks}
        filterOpen={ui.filterOpen}
        filterNote={`Showing ${String(view.preview.shown)} of ${String(view.preview.of)}`}
        filterShown={view.preview.shown}
        layout={layout}
        filterCount={applied.length}
        onFilterOpenChange={(filterOpen) => {
          // The menu opens on the filters that apply, and its boxes apply when it closes.
          onUiChange?.(filterOpen ? { filterOpen, filterChecks: ui.filters } : { filterOpen, filters: ui.filterChecks })
        }}
        onFilterChecksChange={(filterChecks) => {
          onUiChange?.({ filterChecks })
        }}
        onFilterClear={() => {
          onUiChange?.({ filterChecks: allChecks(data.filterMenu) })
        }}
      />
      {layout !== 'phone' || sortFirst === undefined || sorted === undefined || sorted === sortFirst ? null : (
        <Inline gap="6" align="center" className={sortLine} data-figma="sort applied">
          <span className={summary}>{`${data.sortMenu.applied} ${sorted.label.toLowerCase()}`}</span>
          <a
            className={reset}
            href="#reset"
            onClick={(event) => {
              event.preventDefault()
              onUiChange?.({ sort: sortFirst.value })
            }}
          >
            {data.sortMenu.reset}
          </a>
        </Inline>
      )}
      {applied.length === 0 ? null : (
        <AppliedFilters
          sections={applied}
          onRemove={(value) => {
            setFilters(ui.filters.filter((v) => v !== value))
          }}
          onClear={() => {
            setFilters(allChecks(data.filterMenu))
          }}
        />
      )}
      {marked === undefined ? null : (
        <span className={summary} data-figma="search summary">
          {`${plural(view.results, 'result')} for “${q}” in titles, IDs, prompts and notes`}
        </span>
      )}
      {view.groups.map((group) => {
        const open = ui.groupsOpen[group.id]
        return (
          <Stack key={group.id} gap="2">
            <div data-figma={`group · ${group.label.toUpperCase()}`}>
              <GroupHeader
                label={group.label}
                count={group.count}
                dot={group.dot ?? undefined}
                open={open}
                onOpenChange={(next) => {
                  onGroupOpenChange?.(group.id, next)
                }}
              />
            </div>
            {open && group.projects === undefined ? (
              <Rows
                rows={group.rows}
                selectedId={selectedId}
                query={marked}
                onSelectItem={onSelectItem}
                onActions={onActions}
                openable={data.detail?.id}
                onOpenRow={onOpenRow}
                phone={layout === 'phone'}
              />
            ) : null}
            {open && group.projects !== undefined
              ? group.projects.map((p) => (
                  <Stack key={p.label} gap="2">
                    <GroupHeader variant="project" label={p.label} leading={<FolderIcon />} />
                    <Rows
                      rows={p.rows}
                      selectedId={selectedId}
                      query={marked}
                      onSelectItem={onSelectItem}
                      onActions={onActions}
                      openable={data.detail?.id}
                      onOpenRow={onOpenRow}
                      phone={layout === 'phone'}
                    />
                  </Stack>
                ))
              : null}
          </Stack>
        )
      })}
      {more === undefined ? null : (
        <span className={summary} data-figma="done hint">
          {more.text}{' '}
          <a
            className={showIt}
            href="#done"
            onClick={(event) => {
              // Show it selects the Done chip, which lists the matches in Done.
              event.preventDefault()
              onFilterChange?.('done')
            }}
          >
            {more.link}
          </a>
        </span>
      )}
      {ui.filterOpen || view.hidden === 0 ? null : (
        <span className={summary} data-figma="hidden count">
          {`${plural(view.hidden, 'task')} hidden by filters`}
        </span>
      )}
      {data.toast === undefined ? null : (
        <div className={toast} data-figma="toast · created">
          <Toast
            tone="discuss"
            icon={<CheckIcon size="12" />}
            action={{
              label: data.toast.action,
              onClick: () => {
                onToastAction?.()
              },
            }}
          >
            {data.toast.text}
          </Toast>
        </div>
      )}
    </section>
  )
  const acted = view.groups.flatMap((g) => g.rows).find((r) => r.id === ui.actionsFor)
  // The Filter menu's first section names the kinds.
  const kinds = data.filterMenu.sections[0]?.items ?? []
  const actions =
    acted === undefined ? null : (
      <RowActionsSheet
        row={acted}
        kindLabel={kinds.find((k) => k.value === acted.kind)?.label ?? ''}
        menu={data.snoozeMenu}
        open
        onOpenChange={(open) => {
          if (!open) onUiChange?.({ actionsFor: null })
        }}
        onPick={(until) => {
          onPutAway?.(acted.id, until === null ? { result: 'done' } : { until })
        }}
        onDismiss={() => {
          onPutAway?.(acted.id, { result: 'dismissed' })
        }}
      />
    )
  if (!desktop)
    return (
      <Container size={layout} className={data.toast === undefined ? undefined : compactFill}>
        {list}
        {actions}
      </Container>
    )
  if (data.toast === undefined)
    return (
      <>
        {list}
        {actions}
      </>
    )
  return (
    <div className={frame} data-figma="inbox list">
      {list}
      {actions}
    </div>
  )
}
