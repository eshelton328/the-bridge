// A panel of bars on the Activity tab (Figma `panel · by day`, D17 474:602,
// and `panel · where` 474:620): the library's `Panel` with its title in
// capitals and the note at its header's end (its `actions`), the library's
// `HorizontalBarChart` (each row a label, a bar and its count) and the line
// under the rows. Props only.
import { HorizontalBarChart, Panel } from '@eshelton328/component-library-1701'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitActivity } from '../types.ts'

const note = css({ textStyle: 'small', color: 'fg.muted' })
// D17 474:606: the header's note at its end, in the small style.
const end = css({ textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' })

export type ToolkitActivityBarsProps = {
  bars: ToolkitActivity['byDay']
  /** The panel's Figma key: `panel · by day` or `panel · where`. */
  layer: string
}

export function ToolkitActivityBars({ bars, layer }: ToolkitActivityBarsProps) {
  return (
    <div data-figma={layer}>
      <Panel title={bars.label} actions={<span className={end}>{bars.meta}</span>}>
        <BlockBoundary contentKey={bars.label}>
          <HorizontalBarChart label={bars.label} rows={bars.rows} />
        </BlockBoundary>
        {bars.note === undefined ? null : <p className={note}>{bars.note}</p>}
      </Panel>
    </div>
  )
}
