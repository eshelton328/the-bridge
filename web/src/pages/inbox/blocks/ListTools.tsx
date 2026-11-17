// The row under the filter chips: search, Sort and Filter. Filter opens the
// Filter menu when the state has one; an active filter outlines it.
// Props only.
import {
  Button,
  ChevronDownIcon,
  FilterIcon,
  Inline,
  Popover,
  SearchField,
  SearchIcon,
  SortIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu } from '../types.ts'
import { FilterMenu } from './FilterMenu.tsx'

// A flex item keeps its content's width unless it clips; the search field shrinks so Sort and Filter fit.
const search = css({ flex: '1', overflow: 'hidden' })
const row = css({ py: '4' })

export type ListToolsProps = {
  sort: string
  filterMenu: InboxFilterMenu | undefined
  filterOpen: boolean
}

export function ListTools({ sort, filterMenu, filterOpen }: ListToolsProps) {
  const filter = (
    <Button pressed={filterOpen ? true : undefined}>
      <FilterIcon />
      Filter
    </Button>
  )
  return (
    <Inline gap="6" align="center" className={row} data-figma="list tools">
      <div className={search}>
        <SearchField label="Search the inbox" placeholder="Search the inbox" icon={<SearchIcon />} />
      </div>
      <Button>
        <SortIcon />
        {sort}
        <ChevronDownIcon size="12" />
      </Button>
      {filterMenu === undefined ? (
        filter
      ) : (
        <Popover
          trigger={filter}
          label="Filter the inbox"
          open={filterOpen}
          note={filterMenu.note}
          actions={<Button size="sm">Clear</Button>}
        >
          <FilterMenu menu={filterMenu} />
        </Popover>
      )}
    </Inline>
  )
}
