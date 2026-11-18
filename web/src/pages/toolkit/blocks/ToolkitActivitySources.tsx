// The source switch of the Activity view (Figma `source · segmented`, D11
// 444:491): All sessions, Chats or Headless runs, the library's `ViewSwitch`
// as the List, Map and Activity switch draws it. A source with no counts yet
// is disabled (Chats and Headless runs wait for T11 and T12). On the desktop
// it starts the row under the kind chips (`list tools` 444:200), which ends
// with since when the counts start (444:207); a tablet or phone shows the
// switch alone. Props only.
import { ViewSwitch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { ToolkitActivitySource, type ToolkitActivityView } from '../types.ts'
import { sourceItems } from './activityPage.ts'

const row = css({ display: 'flex', alignItems: 'center', gap: '6' })
const alone = css({ alignSelf: 'flex-start' })
const since = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', ms: 'auto' })

export type ToolkitActivitySourcesProps = {
  view: ToolkitActivityView
  value: ToolkitActivitySource
  layout: Viewport
  onChange?: ((source: ToolkitActivitySource) => void) | undefined
}

export function ToolkitActivitySources({ view, value, layout, onChange }: ToolkitActivitySourcesProps) {
  const control = (
    <div className={layout === 'desktop' ? undefined : alone} data-figma="source · segmented">
      <ViewSwitch
        tone="accent"
        size="lg"
        label="Sessions"
        items={sourceItems(view)}
        value={value}
        onValueChange={(next) => {
          const parsed = ToolkitActivitySource.safeParse(next)
          if (parsed.success) onChange?.(parsed.data)
        }}
      />
    </div>
  )
  if (layout !== 'desktop') return control
  return (
    <div className={row} data-figma="list tools">
      {control}
      <span className={since} data-figma="counts legend">
        {view.since}
      </span>
    </div>
  )
}
