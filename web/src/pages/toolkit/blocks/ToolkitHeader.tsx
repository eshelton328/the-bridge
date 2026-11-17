// The Toolkit page's header (Figma `header`, D1 425:10): the title and the
// number of items, where the list is read from, the Read-only badge and
// the List, Map and Activity switch. The tablet and phone leave out the
// source line. Props only.
import {
  Badge,
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
  layout: Viewport
}

export function ToolkitHeader({ count, view, onViewChange, layout }: ToolkitHeaderProps) {
  const desktop = layout === 'desktop'
  return (
    <div data-figma="header">
      <PageHeader title="Toolkit" count={count} countLabel={`${String(count)} items`} size={desktop ? 'page' : 'phone'}>
        {desktop ? <span className={source}>Read from toolkit/ in the brain</span> : null}
        <div data-figma="read-only">
          <Badge variant="quiet" label="Read-only" icon={<LockIcon size="12" />} />
        </div>
        <div data-figma="view · List, Map or Activity">
          <ViewSwitch
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
