// The row under the source chips (Figma 402:15397): the search, Sort and
// Filter, and at the end the Grid or List switch. Sort names the sort on
// the button. Beside an open artifact (D2) the row has no switch, and the
// search takes the free width. With a Filter menu (D3) Filter opens it,
// and with a Sort menu (D6) Sort opens it. On a tablet (T1 405:131) the
// controls are 36 high, 8 apart, and the search takes the free width, and
// Filter opens its menu as a sheet over the tab bar (T3).
// Props only.
import {
  Button,
  ChevronDownIcon,
  CloseIcon,
  FilterIcon,
  GridIcon,
  Inline,
  ListIcon,
  SearchField,
  SearchIcon,
  SortDescIcon,
  ViewSwitch,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { type ArtifactFilterMenu, type ArtifactSortMenu, ViewValue } from '../types.ts'
import { FilterPopover } from './FilterPopover.tsx'
import { FilterSheet } from './FilterSheet.tsx'
import { SortMenu } from './SortMenu.tsx'

// Figma's search and the space before the switch share the row's free width (402:15398, 402:15418).
const grow = css({ flex: '1', overflow: 'hidden' })

export type LibraryToolsProps = {
  placeholder: string
  query: string
  onQueryChange?: ((query: string) => void) | undefined
  /** The sort's short label, such as "Newest". */
  sortLabel: string
  onSortClick?: (() => void) | undefined
  /** The Sort menu (D6); without it Sort is a button that opens nothing yet. */
  sortMenu?: ArtifactSortMenu | undefined
  /** The picked sort, such as `newest`. */
  sort?: string | undefined
  sortOpen?: boolean | undefined
  onSortOpenChange?: ((open: boolean) => void) | undefined
  /** A sort picked in the Sort menu; the menu then closes. */
  onSortChange?: ((sort: string) => void) | undefined
  onFilterClick?: (() => void) | undefined
  /** The Filter menu (D3); without it Filter is a button that opens nothing yet. */
  filterMenu?: ArtifactFilterMenu | undefined
  filterChecks?: readonly string[] | undefined
  filterOpen?: boolean | undefined
  onFilterOpenChange?: ((open: boolean) => void) | undefined
  onFilterChecksChange?: ((checks: string[]) => void) | undefined
  /** Show in the Filter menu: applies the checked boxes. */
  onFilterApply?: (() => void) | undefined
  /** `sheet` opens the Filter menu as a sheet from the bottom (the tablet, T3); `popover` (the default) under Filter. */
  filterAs?: 'popover' | 'sheet' | undefined
  /** `lg` (36, the tablet's controls, T1) or `md` (32, the desktop's). The Sort and Filter menus keep `md`. */
  size?: 'md' | 'lg' | undefined
  /** The Grid or List switch's value; without it the row has no switch (D2). */
  view?: ViewValue | undefined
  onViewChange?: ((view: ViewValue) => void) | undefined
}

export function LibraryTools({
  placeholder,
  query,
  onQueryChange,
  sortLabel,
  onSortClick,
  sortMenu,
  sort = '',
  sortOpen = false,
  onSortOpenChange,
  onSortChange,
  onFilterClick,
  filterMenu,
  filterChecks = [],
  filterOpen = false,
  onFilterOpenChange,
  onFilterChecksChange,
  onFilterApply,
  filterAs = 'popover',
  size = 'md',
  view,
  onViewChange,
}: LibraryToolsProps) {
  const large = size === 'lg'
  return (
    <Inline gap={large ? '8' : '6'} align="center" data-figma="list tools">
      <div className={grow} data-figma="search">
        <SearchField
          label={placeholder}
          size={size}
          textSize="sm"
          placeholder={placeholder}
          icon={<SearchIcon />}
          clearIcon={<CloseIcon />}
          clearLabel="Clear the search"
          value={query}
          onValueChange={onQueryChange}
        />
      </div>
      {sortMenu === undefined ? (
        <span data-figma="button · Sort">
          <Button size={size} textSize="sm" onClick={onSortClick}>
            <SortDescIcon />
            {sortLabel}
            <ChevronDownIcon size="12" />
          </Button>
        </span>
      ) : (
        <SortMenu
          menu={sortMenu}
          sort={sort}
          sortLabel={sortLabel}
          open={sortOpen}
          onOpenChange={onSortOpenChange}
          onSortChange={onSortChange}
        />
      )}
      {filterMenu === undefined ? (
        <span data-figma="button · Filter">
          <Button size={size} textSize="sm" onClick={onFilterClick}>
            <FilterIcon />
            Filter
          </Button>
        </span>
      ) : filterAs === 'sheet' ? (
        <FilterSheet
          menu={filterMenu}
          checks={filterChecks}
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          onChecksChange={onFilterChecksChange}
          onApply={onFilterApply}
        />
      ) : (
        <FilterPopover
          menu={filterMenu}
          checks={filterChecks}
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          onChecksChange={onFilterChecksChange}
          onApply={onFilterApply}
        />
      )}
      {view === undefined ? null : (
        <>
          {/* T1 has no space before the switch: the search takes it (405:132). */}
          {large ? null : <span className={grow} />}
          <span data-figma="view · Grid or List">
            {/* Figma draws two icon-only segments, the picked view's icon cyan on the selected fill, with no border (402:15421). */}
            <ViewSwitch
              tone="accent"
              size={size}
              iconOnly
              label="View"
              value={view}
              onValueChange={(value) => {
                const picked = ViewValue.safeParse(value)
                if (picked.success) onViewChange?.(picked.data)
              }}
              items={[
                { value: 'grid', label: 'Grid', icon: <GridIcon /> },
                { value: 'list', label: 'List', icon: <ListIcon /> },
              ]}
            />
          </span>
        </>
      )}
    </Inline>
  )
}
