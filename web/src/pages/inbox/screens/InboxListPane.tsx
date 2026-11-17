// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows; with the sort by project, a heading
// per project in each group; with a search, a line that sums up the
// results and a hint about matches in Done. Props only.
import { FilterChips, FolderIcon, GroupHeader, PageHeader, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
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
}

export function InboxListPane({ data, ui, onFilterChange, onGroupOpenChange, onSelectItem }: InboxListPaneProps) {
  return (
    <section aria-label="Inbox list" className={pane} data-figma="inbox list">
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
        query={data.search?.query}
        filterMenu={data.filterMenu}
        filterOpen={ui.filterOpen}
      />
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
    </section>
  )
}
