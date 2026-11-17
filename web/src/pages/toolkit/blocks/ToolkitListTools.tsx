// The row under the kind chips (Figma `list tools`, D1 425:56): the search
// over names, descriptions and files, the sort (by name), and on the
// desktop the legend of the counts each card shows. Props only.
import {
  Button,
  ChevronDownIcon,
  CloseCircleIcon,
  SearchField,
  SearchIcon,
  SortIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'

const row = css({ display: 'flex', alignItems: 'center', gap: '6' })
// Figma 425:56: the search and Sort take about the first half of the row (677 of 1384), over the first two card
// columns; no size token has Figma's 566 px search, so the pair takes half the row and the search the rest of it.
const tools = css({ display: 'flex', alignItems: 'center', gap: '6', w: '[50%]', minW: '[0]' })
const compactTools = css({ display: 'flex', alignItems: 'center', gap: '6', flex: '1', minW: '[0]' })
const search = css({ flex: '1', minW: '[0]' })
const legend = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', ms: 'auto' })

export type ToolkitListToolsProps = {
  query: string
  onQueryChange?: ((query: string) => void) | undefined
  layout: Viewport
}

export function ToolkitListTools({ query, onQueryChange, layout }: ToolkitListToolsProps) {
  return (
    <div className={row} data-figma="list tools">
      <div className={layout === 'desktop' ? tools : compactTools}>
        <div className={search} data-figma="search">
          <SearchField
            label="Search the toolkit"
            placeholder="Search names, descriptions and files"
            size="lg"
            icon={<SearchIcon />}
            clearIcon={<CloseCircleIcon />}
            clearLabel="Clear the search"
            value={query}
            onValueChange={onQueryChange}
          />
        </div>
        <Button variant="secondary" size="lg" data-figma="button · Sort" aria-label="Sort by name">
          <SortIcon size="16" />
          Name
          <ChevronDownIcon size="12" />
        </Button>
      </div>
      {layout === 'desktop' ? (
        <span className={legend} data-figma="counts legend">
          links to → · linked from ← · files
        </span>
      ) : null}
    </div>
  )
}
