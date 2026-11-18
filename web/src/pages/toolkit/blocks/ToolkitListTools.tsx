// The row under the kind chips (Figma `list tools`, D1 425:56): the search
// over names, descriptions and files, and on the desktop the sort (by name)
// and the legend of the counts each card shows. A tablet or phone shows the
// search alone, full width (T1 428:48); the phone adds the Read-only line
// under it (M1 429:86). The Map view (D2 426:100) has no Sort, and its
// legend says what a line on the map means. Beside an open item (`pane`, D3
// 427:84) the row is the search alone, as on the phone. Props only.
import {
  Button,
  ChevronDownIcon,
  CloseCircleIcon,
  Grid,
  LockIcon,
  SearchField,
  SearchIcon,
  SortIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitView } from '../types.ts'

const row = css({ display: 'flex', alignItems: 'center', gap: '6' })
// Figma 425:56: the search and Sort take 677 of the 1384 px row, over the first two of the four card columns (684);
// no size token has Figma's 566 px search, so the row is the cards' grid (four columns, 16 apart), the pair spans
// the first two columns and the search takes what Sort leaves. The legend ends the last two.
const tools = css({ display: 'flex', alignItems: 'center', gap: '6', gridColumn: '[span 2]', minW: '[0]' })
const compactTools = css({ display: 'flex', alignItems: 'center', gap: '6', flex: '1', minW: '[0]' })
const legendCell = css({ display: 'flex', alignItems: 'center', gridColumn: '[span 2]', minW: '[0]' })
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
  /** `pane` is the list beside an open item (D3). */
  layout: Viewport | 'pane'
  /** The view under the row; the map has no Sort and its own legend. The list when not set. */
  view?: ToolkitView | undefined
}

export function ToolkitListTools({ query, onQueryChange, layout, view = 'list' }: ToolkitListToolsProps) {
  const map = view === 'map'
  if (layout === 'phone' || layout === 'pane') {
    const field = (
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
    )
    if (layout === 'pane') return field
    return (
      <>
        {field}
        <p className={readOnly} data-figma="read-only line">
          <LockIcon size="12" />
          Read-only · from toolkit/ in the brain
        </p>
      </>
    )
  }
  const field = (
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
  )
  if (layout !== 'desktop') {
    return (
      <div className={row}>
        <div className={compactTools}>{field}</div>
      </div>
    )
  }
  return (
    <Grid columns="4" gap="16" data-figma="list tools">
      <div className={tools}>
        {field}
        {map ? null : (
          // D1 425:62: 12 px sides where `lg` has 16 (Figma 13).
          <Button variant="secondary" size="lg" padding="compact" data-figma="button · Sort" aria-label="Sort by name">
            <SortIcon size="16" />
            Name
            <ChevronDownIcon size="12" />
          </Button>
        )}
      </div>
      <div className={legendCell}>
        <span className={legend} data-figma="counts legend">
          {map ? 'A line means one file links to another' : 'links to → · linked from ← · files'}
        </span>
      </div>
    </Grid>
  )
}
