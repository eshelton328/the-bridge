// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows; with the sort by project, a heading
// per project in each group; with a search, a line that sums up the
// results and a hint about matches in Done; with filters that apply, a row
// of them under the tools and how many tasks they hide; and a toast that
// sticks to the bottom of the list. Props only.
import {
  CheckIcon,
  FilterChips,
  FolderIcon,
  GroupHeader,
  PageHeader,
  Stack,
  Toast,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { AppliedFilters } from '../blocks/AppliedFilters.tsx'
import { InboxRow } from '../blocks/InboxRow.tsx'
import { ListTools } from '../blocks/ListTools.tsx'
import type { InboxData, InboxGroupId, InboxGroupView, InboxUi } from '../types.ts'

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
  onFilterChange?: ((filter: string) => void) | undefined
  onGroupOpenChange?: ((group: InboxGroupId, open: boolean) => void) | undefined
  onSelectItem?: ((id: string) => void) | undefined
  /** The text Erik typed in the search field; without it the field shows the state's query. */
  query?: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
}

export function InboxListPane({
  data,
  ui,
  onFilterChange,
  onGroupOpenChange,
  onSelectItem,
  query,
  onQueryChange,
}: InboxListPaneProps) {
  const list = (
    <section aria-label="Inbox list" className={pane} data-figma={data.toast === undefined ? 'inbox list' : undefined}>
      <div className={header} data-figma="header">
        <PageHeader size="pane" title="Inbox" count={data.count} countLabel={data.countLabel} level={2} />
      </div>
      <div data-figma="filter · chips">
        <FilterChips
          label="Filter the inbox"
          items={data.filters}
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
        sort={data.sort}
        sortActive={data.sortActive}
        sortMenu={data.sortMenu}
        sortOpen={ui.sortOpen}
        query={query ?? data.search?.query}
        onQueryChange={onQueryChange}
        filterMenu={data.filterMenu}
        filterOpen={ui.filterOpen}
        filterCount={data.applied === undefined ? 0 : 1}
      />
      {data.applied === undefined ? null : <AppliedFilters applied={data.applied} />}
      {data.search === undefined ? null : (
        <span className={summary} data-figma="search summary">
          {data.search.summary}
        </span>
      )}
      {data.groups.map((group) => {
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
              <Rows rows={group.rows} ui={ui} query={data.search?.query} onSelectItem={onSelectItem} />
            ) : null}
            {open && group.projects !== undefined
              ? group.projects.map((p) => (
                  <Stack key={p.label} gap="2">
                    <GroupHeader variant="project" label={p.label} leading={<FolderIcon />} />
                    <Rows rows={p.rows} ui={ui} query={data.search?.query} onSelectItem={onSelectItem} />
                  </Stack>
                ))
              : null}
          </Stack>
        )
      })}
      {data.search === undefined ? null : (
        <span className={summary} data-figma="done hint">
          {data.search.more.text}{' '}
          <a className={showIt} href="#done">
            {data.search.more.link}
          </a>
        </span>
      )}
      {data.applied === undefined ? null : (
        <span className={summary} data-figma="hidden count">
          {data.applied.hidden}
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
  if (data.toast === undefined) return list
  return (
    <div className={frame} data-figma="inbox list">
      {list}
    </div>
  )
}
