// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows. Props only.
import { FilterChips, GroupHeader, PageHeader, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { InboxRow } from '../blocks/InboxRow.tsx'
import { ListTools } from '../blocks/ListTools.tsx'
import type { InboxData, InboxGroupId, InboxUi } from '../types.ts'

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
          onValueChange={(values) => {
            const [first] = values
            if (first !== undefined) onFilterChange?.(first)
          }}
        />
      </div>
      <ListTools sort={data.sort} filterMenu={data.filterMenu} filterOpen={ui.filterOpen} />
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
            {open
              ? group.rows.map((row) => (
                  <InboxRow
                    key={row.id}
                    row={row}
                    selected={row.id === ui.selectedId}
                    onSelect={
                      onSelectItem === undefined
                        ? undefined
                        : () => {
                            onSelectItem(row.id)
                          }
                    }
                  />
                ))
              : null}
          </Stack>
        )
      })}
    </section>
  )
}
