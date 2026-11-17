// The row under the kind chips (Figma `list tools`, D1 425:56): the search
// over names, descriptions and files, and on the desktop the sort (by name)
// and the legend of the counts each card shows. A tablet or phone shows the
// search alone, full width (T1 428:48); the phone adds the Read-only line
// under it (M1 429:86). The Map view (D2 426:100) has no Sort, and its
// legend says what a line on the map means. Props only.
import {
  Button,
  ChevronDownIcon,
  CloseCircleIcon,
  LockIcon,
  SearchField,
  SearchIcon,
  SortIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitView } from '../types.ts'

const row = css({ display: 'flex', alignItems: 'center', gap: '6' })
// Figma 425:56: the search and Sort take about the first half of the row (677 of 1384), over the first two card
// columns; no size token has Figma's 566 px search, so the pair takes half the row and the search the rest of it.
const tools = css({ display: 'flex', alignItems: 'center', gap: '6', w: '[50%]', minW: '[0]' })
const compactTools = css({ display: 'flex', alignItems: 'center', gap: '6', flex: '1', minW: '[0]' })
const search = css({ flex: '1', minW: '[0]' })
// M1 429:86: the lock, then the source in mono, as wide as its text.
const readOnly = css({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '6',
  textStyle: 'mono',
  color: 'fg.muted',
})
const legend = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', ms: 'auto' })

export type ToolkitListToolsProps = {
  query: string
  onQueryChange?: ((query: string) => void) | undefined
  layout: Viewport
  /** The view under the row; the map has no Sort and its own legend. The list when not set. */
  view?: ToolkitView | undefined
}

export function ToolkitListTools({ query, onQueryChange, layout, view = 'list' }: ToolkitListToolsProps) {
  const map = view === 'map'
  if (layout === 'phone') {
    return (
      <>
        <div data-figma="search">
          <SearchField
            label="Search the toolkit"
            placeholder="Search the toolkit"
            size="lg"
            icon={<SearchIcon />}
            clearIcon={<CloseCircleIcon />}
            clearLabel="Clear the search"
            value={query}
            onValueChange={onQueryChange}
          />
        </div>
        <p className={readOnly} data-figma="read-only line">
          <LockIcon size="12" />
          Read-only · from toolkit/ in the brain
        </p>
      </>
    )
  }
  return (
    <div className={row} data-figma={layout === 'desktop' ? 'list tools' : undefined}>
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
        {layout === 'desktop' && !map ? (
          <Button variant="secondary" size="lg" data-figma="button · Sort" aria-label="Sort by name">
            <SortIcon size="16" />
            Name
            <ChevronDownIcon size="12" />
          </Button>
        ) : null}
      </div>
      {layout === 'desktop' ? (
        <span className={legend} data-figma="counts legend">
          {map ? 'A line means one file links to another' : 'links to → · linked from ← · files'}
        </span>
      ) : null}
    </div>
  )
}
