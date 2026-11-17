// The Inbox list pane: the header with the count, the filter chips, the
// search row and the groups of rows. Props only.
import {
  Button,
  FilterChips,
  GroupHeader,
  Inline,
  PageHeader,
  SearchField,
  SearchIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { InboxRow } from '../blocks/InboxRow.tsx'
import type { InboxData, InboxGroupId, InboxUi } from '../types.ts'

const pane = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12',
  flex: '1',
  p: '12',
  pb: '0',
  overflow: 'auto',
  bg: 'surface.pane',
})
const search = css({ flex: '1' })

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
      <PageHeader size="pane" title="Inbox" count={data.count} countLabel={data.countLabel} level={2} />
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
      <Inline gap="8" align="center">
        <div className={search}>
          <SearchField size="sm" label="Search the inbox" placeholder="Search the inbox" icon={<SearchIcon />} />
        </div>
        <Button size="sm">Newest</Button>
        <Button size="sm">Filter</Button>
      </Inline>
      {data.groups.map((group) => {
        const open = ui.groupsOpen[group.id]
        return (
          <Stack key={group.id} gap="2">
            <GroupHeader
              label={group.label}
              count={group.count}
              dot={group.dot}
              open={open}
              onOpenChange={(next) => {
                onGroupOpenChange?.(group.id, next)
              }}
            />
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
