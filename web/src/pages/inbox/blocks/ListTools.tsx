// The row under the filter chips: search, Sort and Filter. Sort opens the
// Sort menu and Filter the Filter menu when the state has one; a sort or
// filter that applies, or an open menu, shows its button pressed. A search
// shows its query in the field. Props only.
import {
  Button,
  ChevronDownIcon,
  CloseCircleIcon,
  FilterIcon,
  Inline,
  Popover,
  RadioMenu,
  SearchField,
  SearchIcon,
  SortDescIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu, InboxSortMenu } from '../types.ts'
import { FilterMenu } from './FilterMenu.tsx'

// A flex item keeps its content's width unless it clips; the search field shrinks so Sort and Filter fit.
const search = css({ flex: '1', overflow: 'hidden' })
const row = css({ py: '4' })

export type ListToolsProps = {
  sort: string
  sortActive: boolean
  sortMenu: InboxSortMenu | undefined
  sortOpen: boolean
  query: string | undefined
  filterMenu: InboxFilterMenu | undefined
  filterOpen: boolean
}

function SortButton({
  sort,
  active,
  menu,
  open,
}: {
  sort: string
  active: boolean
  menu: InboxSortMenu | undefined
  open: boolean
}) {
  const button = (
    <Button pressed={active || open ? true : undefined}>
      <SortDescIcon />
      {sort}
      <ChevronDownIcon size="12" />
    </Button>
  )
  if (menu === undefined) return button
  return (
    <RadioMenu
      trigger={button}
      label={menu.heading}
      heading={menu.heading}
      width="sort"
      data-figma="menu · Sort"
      open={open}
      value={menu.selected}
      options={menu.options}
      note={menu.note}
    />
  )
}

export function ListTools({ sort, sortActive, sortMenu, sortOpen, query, filterMenu, filterOpen }: ListToolsProps) {
  const filter = (
    <Button pressed={filterOpen ? true : undefined}>
      <FilterIcon />
      Filter
    </Button>
  )
  return (
    <Inline gap="6" align="center" className={row} data-figma="list tools">
      <div className={search}>
        <SearchField
          label="Search the inbox"
          placeholder="Search the inbox"
          icon={<SearchIcon />}
          defaultValue={query}
          clearIcon={<CloseCircleIcon />}
          clearSize="16"
          clearLabel="Clear the search"
        />
      </div>
      <SortButton sort={sort} active={sortActive} menu={sortMenu} open={sortOpen} />
      {filterMenu === undefined ? (
        filter
      ) : (
        <Popover
          trigger={filter}
          width="filter"
          data-figma="filter popover"
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
