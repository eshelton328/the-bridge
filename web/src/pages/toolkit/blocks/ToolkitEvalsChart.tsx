// The chart panel of the Evals tab (Figma `panel · opus by round`, D20
// 482:1927): the header (the chart's label and its legend at the end), the
// pass rate of each round with and without the skill as the library's
// GroupedBarChart (`chart` 482:1932 and `axis` 482:1947: 16 px bars 4 apart,
// a group every 56 px, 110 high, the round under each group) and a line on
// how to read it. On a tablet (T16 482:2288) the chart fills the panel and
// spreads the groups over it (`width="fill"`); on the phone (M18 482:2602) it
// draws 12 px bars, a group every 44 (`size="sm"`), 308 wide in the 332 px
// panel (LIBRARY_GAPS.md, Evals bar chart). Props only.
import { GroupedBarChart, Panel } from '@eshelton328/component-library-1701'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitEvals } from '../types.ts'
import { chartSeries } from './evalsView.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'

// D20 482:1932, M18 482:2602: the chart is as wide as its groups (392, 308 on the phone), not the panel. T16
// 482:2288: on a tablet it is as wide as the panel (630).
const chartBox = css({ w: 'fit-content', maxW: '[100%]' })
const chartBoxFill = css({ w: '[100%]' })
// D20 482:1955: the line is 8 under the axis in Figma; the header is 1 px shorter in the render (d-072), so 2 more.
const note = css({ textStyle: 'small', color: 'fg.muted', mt: '2' })

export type ToolkitEvalsChartProps = {
  chart: NonNullable<ToolkitEvals['chart']>
  layout?: Viewport | undefined
}

export function ToolkitEvalsChart({ chart, layout = 'desktop' }: ToolkitEvalsChartProps) {
  return (
    <section aria-label={chart.label} data-figma="panel · opus by round">
      <Panel>
        <ToolkitEvalsHeader label={chart.label} end={{ type: 'note', label: chart.meta }} />
        <div className={layout === 'tablet' ? chartBoxFill : chartBox} data-figma="chart">
          <BlockBoundary contentKey={chart.label}>
            <GroupedBarChart
              label={chart.label}
              series={chartSeries(chart)}
              groups={chart.groups}
              max={chart.max}
              size={layout === 'phone' ? 'sm' : 'md'}
              width={layout === 'tablet' ? 'fill' : 'content'}
            />
          </BlockBoundary>
        </div>
        <p className={note}>{chart.note}</p>
      </Panel>
    </section>
  )
}
