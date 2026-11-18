// The Toolkit page's header (Figma `header`, D1 425:10): the title and the
// number of items, where the list is read from, the Read-only badge and
// the List, Map and Activity switch. The tablet and phone leave out the
// source line. The phone (M1 429:51) shows the three views as icon buttons
// and puts Read-only under the search (ToolkitListTools). Beside an open item
// (`pane`, D3 427:55) the header is the title, the count and Read-only, with
// no source and no views. The Activity view (D11 444:158) says its counts come
// from the session files; D12 keys the header by its node id (`layer`), as its
// run panel has a header too. Props only.
import {
  Badge,
  Button,
  ChartIcon,
  ListIcon,
  LockIcon,
  MapIcon,
  PageHeader,
  ViewSwitch,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { ToolkitView } from '../types.ts'

const source = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })

const views = [
  { value: 'list', label: 'List', icon: <ListIcon /> },
  { value: 'map', label: 'Map', icon: <MapIcon /> },
  { value: 'activity', label: 'Activity', icon: <ChartIcon /> },
]

export type ToolkitHeaderProps = {
  count: number
  view: ToolkitView
  onViewChange?: ((view: ToolkitView) => void) | undefined
  /** `pane` is the list beside an open item (D3). */
  layout: Viewport | 'pane'
  /** Where the page reads from, on the desktop; toolkit/ in the brain when not set. */
  source?: string | undefined
  /** The header's Figma key; `header` when not set. */
  layer?: string | undefined
}

export function ToolkitHeader({
  count,
  view,
  onViewChange,
  layout,
  source: readFrom = 'Read from toolkit/ in the brain',
  layer = 'header',
}: ToolkitHeaderProps) {
  const desktop = layout === 'desktop'
  if (layout === 'pane') {
    return (
      <div data-figma="header">
        <PageHeader title="Toolkit" count={count} countLabel={`${String(count)} items`} size="page">
          <div data-figma="read-only">
            <Badge variant="quiet" label="Read-only" icon={<LockIcon size="12" />} />
          </div>
        </PageHeader>
      </div>
    )
  }
  if (layout === 'phone') {
    return (
      <div data-figma="header">
        <PageHeader title="Toolkit" count={count} countLabel={`${String(count)} items`} size="phone">
          {views.map((item) => (
            <Button
              key={item.value}
              variant="secondary"
              size="lg"
              iconOnly
              aria-label={item.label}
              pressedTone="accent"
              pressed={view === item.value}
              data-figma={`button · ${item.value}`}
              onClick={() => {
                const parsed = ToolkitView.safeParse(item.value)
                if (parsed.success) onViewChange?.(parsed.data)
              }}
            >
              {item.icon}
            </Button>
          ))}
        </PageHeader>
      </div>
    )
  }
  return (
    <div data-figma={layer}>
      <PageHeader title="Toolkit" count={count} countLabel={`${String(count)} items`} size={desktop ? 'page' : 'phone'}>
        {desktop ? <span className={source}>{readFrom}</span> : null}
        <div data-figma="read-only">
          <Badge variant="quiet" label="Read-only" icon={<LockIcon size="12" />} />
        </div>
        <div data-figma="view · List, Map or Activity">
          <ViewSwitch
            tone="accent"
            label="View"
            size="lg"
            items={views}
            value={view}
            onValueChange={(next) => {
              const parsed = ToolkitView.safeParse(next)
              if (parsed.success) onViewChange?.(parsed.data)
            }}
          />
        </div>
      </PageHeader>
    </div>
  )
}
