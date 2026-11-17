// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows; with the sort by project, a heading
// per project in each group; with a search, a line that sums up the
// results and a hint about matches in Done; with filters that apply, a row
// of them under the tools and how many tasks they hide; and a toast that
// sticks to the bottom of the list. On the tablet and phone (T1, T6, T7)
// the list fills the screen on the backdrop, with the page's large title.
// The rows and counts come from listView (Erik's sort, search, filters and
// snoozed items over the state's groups); the menus report through
// onUiChange. Props only.
import {
  CheckIcon,
  Container,
  FilterChips,
  FolderIcon,
  GroupHeader,
  PageHeader,
  Stack,
  Toast,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { AppliedFilters } from '../blocks/AppliedFilters.tsx'
import { InboxRow } from '../blocks/InboxRow.tsx'
import { ListTools } from '../blocks/ListTools.tsx'
import type { InboxData, InboxGroupId, InboxGroupView, InboxUi } from '../types.ts'
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
// The tablet list (T1 346:5415) sits on the backdrop, with no pane fill; the Container pads it.
const compactPane = css({ display: 'flex', flexDirection: 'column', gap: '2' })
const header = css({ py: '4' })
const summary = css({ textStyle: 'small', color: 'fg.muted', alignSelf: 'flex-start' })
const showIt = css({ color: 'fg.accent', textDecoration: 'none', _hover: { textDecoration: 'underline' } })

function Rows({
  rows,
  ui,
  query,
  onSelectItem,
}: {
  rows: InboxGroupView['rows']
  ui: InboxUi
  query: string | undefined
  onSelectItem: ((id: string) => void) | undefined
}) {
  return rows.map((row) => (
    <InboxRow
      key={row.id}
      row={row}
      selected={row.id === ui.selectedId}
      query={query}
      onSelect={
        onSelectItem === undefined
          ? undefined
          : () => {
              onSelectItem(row.id)
            }
      }
    />
  ))
}

export type InboxListPaneProps = {
  data: InboxData
  ui: InboxUi
  /** The screen's layout: a pane beside the detail on the desktop, the whole screen on a tablet or phone. */
  layout?: Viewport | undefined
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
  /** The text Erik typed in the search field; without it the field shows the state's query. */
  query?: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  /** Reports what Erik changes in the list: the sort, the filters and their menus. */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
}

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? '' : 's'}`

export function InboxListPane({
  data,
  ui,
  layout = 'desktop',
  onFilterChange,
  onGroupOpenChange,
  onSelectItem,
  query,
  onQueryChange,
  onUiChange,
}: InboxListPaneProps) {
  const desktop = layout === 'desktop'
  const q = query ?? data.search?.query ?? ''
  const view = listView(data, ui, q)
  const marked = q.trim() === '' ? undefined : q
  // The hint about matches in Done belongs to the state's own search.
  const more = data.search?.query === q ? data.search.more : undefined
  // While the Filter menu is open it shows the filters; the applied row, the count on Filter and the hidden line wait.
  const applied = ui.filterOpen ? [] : view.applied
  const setFilters = (filters: string[]) => {
    onUiChange?.({ filters, filterChecks: filters })
  }
  const list = (
    <section
      aria-label="Inbox list"
      className={desktop ? pane : compactPane}
      data-figma={data.toast === undefined ? 'inbox list' : undefined}
    >
      <div className={desktop ? header : undefined} data-figma="header">
        <PageHeader
          size={desktop ? 'pane' : 'phone'}
          title="Inbox"
          count={view.count}
          countLabel={plural(view.count, 'task')}
          level={desktop ? 2 : 1}
        />
      </div>
      <div data-figma="filter · chips">
        <FilterChips
          label="Filter the inbox"
          items={view.filters}
          value={[ui.filter]}
          multiple={false}
          size="compact"
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
        onSortChange={(sort) => {
          onUiChange?.({ sort, sortOpen: false })
        }}
        query={q}
        onQueryChange={onQueryChange}
        filterMenu={data.filterMenu}
        filterChecks={ui.filterChecks}
        filterOpen={ui.filterOpen}
        filterNote={`Showing ${String(view.preview.shown)} of ${String(view.preview.of)}`}
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
              <Rows rows={group.rows} ui={ui} query={marked} onSelectItem={onSelectItem} />
            ) : null}
            {open && group.projects !== undefined
              ? group.projects.map((p) => (
                  <Stack key={p.label} gap="2">
                    <GroupHeader variant="project" label={p.label} leading={<FolderIcon />} />
                    <Rows rows={p.rows} ui={ui} query={marked} onSelectItem={onSelectItem} />
                  </Stack>
                ))
              : null}
          </Stack>
        )
      })}
      {more === undefined ? null : (
        <span className={summary} data-figma="done hint">
          {more.text}{' '}
          <a className={showIt} href="#done">
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
            action={{ label: data.toast.action, onClick: () => undefined }}
          >
            {data.toast.text}
          </Toast>
        </div>
      )}
    </section>
  )
  if (!desktop) return <Container size={layout}>{list}</Container>
  if (data.toast === undefined) return list
  return (
    <div className={frame} data-figma="inbox list">
      {list}
    </div>
  )
}
