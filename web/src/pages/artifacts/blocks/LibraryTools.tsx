// The row under the source chips (Figma 402:15397): the search, Sort and
// Filter, and at the end the Grid or List switch. Sort names the sort on
// the button. Props only.
import {
  Button,
  ChevronDownIcon,
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
import { ViewValue } from '../types.ts'

// Figma's search and the space before the switch share the row's free width (402:15398, 402:15418).
const grow = css({ flex: '1', overflow: 'hidden' })

export type LibraryToolsProps = {
  placeholder: string
  query: string
  onQueryChange?: ((query: string) => void) | undefined
  /** The sort's short label, such as "Newest". */
  sortLabel: string
  onSortClick?: (() => void) | undefined
  onFilterClick?: (() => void) | undefined
  view: ViewValue
  onViewChange?: ((view: ViewValue) => void) | undefined
}

export function LibraryTools({
  placeholder,
  query,
  onQueryChange,
  sortLabel,
  onSortClick,
  onFilterClick,
  view,
  onViewChange,
}: LibraryToolsProps) {
  return (
    <Inline gap="6" align="center" data-figma="list tools">
      <div className={grow} data-figma="search">
        <SearchField
          label={placeholder}
          textSize="sm"
          placeholder={placeholder}
          icon={<SearchIcon />}
          value={query}
          onValueChange={onQueryChange}
        />
      </div>
      <span data-figma="button · Sort">
        <Button textSize="sm" onClick={onSortClick}>
          <SortDescIcon />
          {sortLabel}
          <ChevronDownIcon size="12" />
        </Button>
      </span>
      <span data-figma="button · Filter">
        <Button textSize="sm" onClick={onFilterClick}>
          <FilterIcon />
          Filter
        </Button>
      </span>
      <span className={grow} />
      <span data-figma="view · Grid or List">
        <ViewSwitch
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
    </Inline>
  )
}
