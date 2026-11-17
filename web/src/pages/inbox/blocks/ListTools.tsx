// The row under the filter chips: search, Sort and Filter. Sort opens the
// Sort menu and Filter the Filter menu when the state has one; a sort or
// filter that applies, or an open menu, shows its button pressed, and
// Filter shows how many filters apply. A search shows its query in the
// field. Props only.
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
  /** The text in the search field; the field shows it and reports each change. */
  query: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  filterMenu: InboxFilterMenu | undefined
  filterOpen: boolean
  /** How many filters apply; Filter then shows the number and is pressed. */
  filterCount?: number | undefined
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

export function ListTools({
  sort,
  sortActive,
  sortMenu,
  sortOpen,
  query,
  onQueryChange,
  filterMenu,
  filterOpen,
  filterCount = 0,
}: ListToolsProps) {
  const filter = (
    <Button pressed={filterOpen || filterCount > 0 ? true : undefined}>
      <FilterIcon />
      {filterCount > 0 ? `Filter · ${String(filterCount)}` : 'Filter'}
    </Button>
  )
  return (
    <Inline gap="6" align="center" className={row} data-figma="list tools">
      <div className={search}>
        <SearchField
          label="Search the inbox"
          placeholder="Search the inbox"
          icon={<SearchIcon />}
          value={query ?? ''}
          onValueChange={onQueryChange}
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
