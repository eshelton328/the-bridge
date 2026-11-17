// The row under the filter chips: search, Sort and Filter. Sort opens the
// Sort menu, which names the sort on the button, and Filter the Filter
// menu, whose Clear checks every box; a sort or filter that applies, or an
// open menu, shows its button pressed, and Filter shows how many filters
// apply. A search shows its query in the field. Props only.
import {
  BottomSheet,
  BottomSheetClose,
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
import type { Viewport } from '../../../lib/screenState.ts'
import { type InboxFilterMenu, type InboxSortMenu, SortValue } from '../types.ts'
import { FilterMenu } from './FilterMenu.tsx'

// A flex item keeps its content's width unless it clips; the search field shrinks so Sort and Filter fit.
const search = css({ flex: '1', overflow: 'hidden' })
const row = css({ py: '4' })
// M7 346:10586: the Show button 2 under the boxes, 4 in from the sheet's 13 px inset.
const sheetFoot = css({ px: '4', pt: '8' })
const wide = css({ w: '[100%]' })

export type ListToolsProps = {
  sortMenu: InboxSortMenu
  sort: SortValue
  sortOpen: boolean
  onSortOpenChange?: ((open: boolean) => void) | undefined
  onSortChange?: ((sort: SortValue) => void) | undefined
  /** The text in the search field; the field shows it and reports each change. */
  query: string | undefined
  onQueryChange?: ((query: string) => void) | undefined
  filterMenu: InboxFilterMenu
  /** The Filter menu's checked boxes. */
  filterChecks: readonly string[]
  filterOpen: boolean
  /** The footer of the Filter menu, such as "Showing 6 of 7". */
  filterNote: string
  /** How many filters apply; Filter then shows the number and is pressed. */
  filterCount?: number | undefined
  onFilterOpenChange?: ((open: boolean) => void) | undefined
  onFilterChecksChange?: ((checks: string[]) => void) | undefined
  /** Clear in the Filter menu: checks every box. */
  onFilterClear?: (() => void) | undefined
  /** How many tasks the Filter menu's boxes show, on the phone's Show button. */
  filterShown: number
  layout?: Viewport | undefined
}

type SortButtonProps = Pick<ListToolsProps, 'sortMenu' | 'sort' | 'sortOpen' | 'onSortOpenChange' | 'onSortChange'> & {
  iconOnly: boolean
}

function SortButton({ sortMenu, sort, sortOpen, onSortOpenChange, onSortChange, iconOnly }: SortButtonProps) {
  // The first choice is the default; another shows the button pressed (T11: picking Newest first again resets it).
  const active = sortMenu.options[0]?.value !== sort
  const button = iconOnly ? (
    <Button iconOnly aria-label="Sort" pressed={active || sortOpen ? true : undefined}>
      <SortDescIcon />
    </Button>
  ) : (
    <Button pressed={active || sortOpen ? true : undefined}>
      <SortDescIcon />
      {sortMenu.options.find((o) => o.value === sort)?.short}
      <ChevronDownIcon size="12" />
    </Button>
  )
  // A menu keeps its box in the page while closed; it stands for its Figma layer only while open.
  return (
    <RadioMenu
      trigger={button}
      label={sortMenu.heading}
      heading={sortMenu.heading}
      width="sort"
      data-figma={sortOpen ? 'menu · Sort' : undefined}
      open={sortOpen}
      onOpenChange={onSortOpenChange}
      value={sort}
      onValueChange={(value) => {
        const picked = SortValue.safeParse(value)
        if (picked.success) onSortChange?.(picked.data)
      }}
      options={sortMenu.options}
      note={sortMenu.note}
    />
  )
}

export function ListTools({
  query,
  onQueryChange,
  filterMenu,
  filterChecks,
  filterOpen,
  filterNote,
  filterCount = 0,
  onFilterOpenChange,
  onFilterChecksChange,
  onFilterClear,
  filterShown,
  layout = 'desktop',
  ...sort
}: ListToolsProps) {
  const phone = layout === 'phone'
  const filter = phone ? (
    <Button iconOnly aria-label="Filter" pressed={filterOpen || filterCount > 0 ? true : undefined}>
      <FilterIcon />
    </Button>
  ) : (
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
      <SortButton {...sort} iconOnly={phone} />
      {phone ? (
        <BottomSheet
          title="Filter"
          trigger={filter}
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          actions={
            <Button variant="text" size="sm" onClick={onFilterClear}>
              Clear
            </Button>
          }
        >
          <div data-figma="filter popover">
            <FilterMenu menu={filterMenu} checks={filterChecks} onChecksChange={onFilterChecksChange} sheet />
          </div>
          <div className={sheetFoot}>
            <BottomSheetClose>
              <Button variant="primary" size="xl" className={wide}>
                {`Show ${String(filterShown)} task${filterShown === 1 ? '' : 's'}`}
              </Button>
            </BottomSheetClose>
          </div>
        </BottomSheet>
      ) : (
        <Popover
          trigger={filter}
          width="filter"
          data-figma={filterOpen ? 'filter popover' : undefined}
          label="Filter the inbox"
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          note={filterNote}
          actions={
            <Button size="sm" onClick={onFilterClear}>
              Clear
            </Button>
          }
        >
          <FilterMenu menu={filterMenu} checks={filterChecks} onChecksChange={onFilterChecksChange} />
        </Popover>
      )}
    </Inline>
  )
}
