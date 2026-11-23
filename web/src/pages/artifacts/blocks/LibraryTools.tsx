// The row under the source chips (Figma 402:15397): the search, Sort and
// Filter, and at the end the Grid or List switch. Sort names the sort on
// the button. Beside an open artifact (D2) the row has no switch, and the
// search takes the free width. With a Filter menu (D3) Filter opens it,
// and with a Sort menu (D6) Sort opens it. On a tablet (T1 405:131) the
// controls are 36 high, 8 apart, and the search takes the free width, and
// Filter opens its menu as a sheet over the tab bar (T3). On a phone (M1
// 406:90) Sort and Filter are 36 px icon-only buttons, and Sort opens its
// menu as a sheet over the tab bar (M4).
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
import { useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { type ArtifactFilterMenu, type ArtifactSortMenu, ViewValue } from '../types.ts'
import { FilterPopover } from './FilterPopover.tsx'
import { FilterSheet } from './FilterSheet.tsx'
import { SortMenu } from './SortMenu.tsx'
import { SortSheet } from './SortSheet.tsx'

// Figma's search and the space before the switch share the row's free width (402:15398, 402:15418).
const grow = css({ flex: '1', overflow: 'hidden' })
// M1 406:100, 406:107: the phone's icon-only Sort and Filter draw their icons in the muted grey (`fg.muted`), also
// while pressed (M3 407:61); a secondary Button draws its content in `fg.default`.
const mutedIcon = css({ display: 'inline-flex', color: 'fg.muted' })

export type LibraryToolsProps = {
  placeholder: string
  query: string
  onQueryChange?: ((query: string) => void) | undefined
  /** The search has the focus when the row opens, as Figma draws it while the owner types (D4 403:7799, M5 408:50). */
  searchFocus?: boolean | undefined
  /** The sort's short label, such as "Newest". */
  sortLabel: string
  onSortClick?: (() => void) | undefined
  /** The Sort menu (D6); without it Sort is a button that opens nothing yet. */
  sortMenu?: ArtifactSortMenu | undefined
  /** The picked sort, such as `newest`. */
  sort?: string | undefined
  sortOpen?: boolean | undefined
  onSortOpenChange?: ((open: boolean) => void) | undefined
  /**
   * A sort picked in the Sort menu; the caller closes the menu. With `sortAs="sheet"` an arrow key also moves the
   * sort, and the sheet closes itself on a pick through `onSortOpenChange`.
   */
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
  /** `sheet` opens the Sort menu as a sheet from the bottom (the phone, M4); `popover` (the default) under Sort. */
  sortAs?: 'popover' | 'sheet' | undefined
  /** `lg` (36, the tablet's controls, T1) or `md` (32, the desktop's). The Sort and Filter menus keep `md`. */
  size?: 'md' | 'lg' | undefined
  /** Sort and Filter as icon-only buttons, named by their labels (the phone, M1 406:97, 406:104). */
  iconOnly?: boolean | undefined
  /** The search field's Figma layer; "search" when not set (M5 names it by its node id). */
  searchFigma?: string | undefined
  /** Extra classes for the row, such as the phone's space above the controls (M1 406:90). */
  className?: string | undefined
  /** The Grid or List switch's value; without it the row has no switch (D2). */
  view?: ViewValue | undefined
  onViewChange?: ((view: ViewValue) => void) | undefined
  /** While the page loads: every control drawn and off, with no menu (the loading standard, R12). */
  disabled?: boolean | undefined
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
  sortAs = 'popover',
  size = 'md',
  iconOnly = false,
  searchFigma = 'search',
  searchFocus = false,
  className,
  view,
  onViewChange,
  disabled = false,
}: LibraryToolsProps) {
  // While the page loads, Sort and Filter are the plain buttons their menus open from, off.
  const sorts = disabled ? undefined : sortMenu
  const filters = disabled ? undefined : filterMenu
  const large = size === 'lg'
  // The desktop's 32 px Sort and Filter pad 10 at the sides (D1 402:15404, 402:15413); T1's 36 px ones keep 16.
  const sidePadding = large ? 'default' : 'compact'
  // `SearchField` takes no ref or `autoFocus`, so the row focuses its input, as `ChatNameField` does.
  const searchRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (searchFocus) searchRef.current?.querySelector('input')?.focus()
  }, [searchFocus])
  return (
    <Inline
      gap={large && !iconOnly ? '8' : '6'}
      align="center"
      className={className}
      data-figma="list tools"
      data-fit="tools"
      data-keyboard-keep=""
    >
      <div ref={searchRef} className={grow} data-figma={searchFigma}>
        <SearchField
          label={placeholder}
          size={size}
          textSize="sm"
          placeholder={placeholder}
          icon={<SearchIcon />}
          clearIcon={<CloseIcon />}
          // D4 403:8202, M5 408:288: in the focused field Figma's × is bold and bright, 14 px (16 on the 4 px grid);
          // `strong` draws the library's `CloseBoldIcon` in `fg.default` while the field has the focus.
          clearSize="16"
          clearFocus="strong"
          clearLabel="Clear the search"
          value={query}
          onValueChange={onQueryChange}
          disabled={disabled}
        />
      </div>
      {sorts === undefined ? (
        <span data-figma="button · Sort">
          {iconOnly ? (
            <Button size={size} iconOnly aria-label={`Sort: ${sortLabel}`} onClick={onSortClick} disabled={disabled}>
              <span className={mutedIcon}>
                <SortDescIcon />
              </span>
            </Button>
          ) : (
            <Button
              size={size}
              textSize="sm"
              padding={sidePadding}
              keepIconSize
              onClick={onSortClick}
              disabled={disabled}
            >
              <SortDescIcon />
              {sortLabel}
              <ChevronDownIcon size="12" />
            </Button>
          )}
        </span>
      ) : sortAs === 'sheet' ? (
        <SortSheet
          menu={sorts}
          sort={sort}
          sortLabel={sortLabel}
          open={sortOpen}
          onOpenChange={onSortOpenChange}
          onSortChange={onSortChange}
        />
      ) : (
        <SortMenu
          menu={sorts}
          sort={sort}
          sortLabel={sortLabel}
          open={sortOpen}
          onOpenChange={onSortOpenChange}
          onSortChange={onSortChange}
        />
      )}
      {filters === undefined ? (
        <span data-figma="button · Filter">
          {iconOnly ? (
            <Button size={size} iconOnly aria-label="Filter" onClick={onFilterClick} disabled={disabled}>
              <span className={mutedIcon}>
                <FilterIcon />
              </span>
            </Button>
          ) : (
            <Button size={size} textSize="sm" padding={sidePadding} onClick={onFilterClick} disabled={disabled}>
              <FilterIcon />
              Filter
            </Button>
          )}
        </span>
      ) : filterAs === 'sheet' ? (
        <FilterSheet
          menu={filters}
          checks={filterChecks}
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          onChecksChange={onFilterChecksChange}
          onApply={onFilterApply}
          iconOnly={iconOnly}
        />
      ) : (
        <FilterPopover
          menu={filters}
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
              disabled={disabled}
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
