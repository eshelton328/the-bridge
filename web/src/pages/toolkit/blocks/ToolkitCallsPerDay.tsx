// The calls per day of the Activity view (Figma `panel · CALLS PER DAY`, D11
// 444:581; T9 `panel · calls per day` 449:298): a `Panel` with its header
// (the label in capitals, the note on the scales at its end) over one
// library `DailyBarChart` per source, each with its legend and its own
// "max", the headless runs violet and the chats cyan; only the last chart
// names the days under it. The library's chart is 78 high on every layout,
// where the tablet's is 56 and the phone's 44 (LIBRARY_GAPS.md, Activity
// daily chart). Props only.
import { DailyBarChart, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityCounts } from '../types.ts'
import { axisLabels, dailyBars, panelLayer, seriesTone } from './activityPage.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'

// D11 444:520: the two panels of a row are as tall as the taller; the section's grid stretches its Panel.
const fill = css({ display: 'grid' })

// D11 444:582 to 444:597: the header, then each chart 12 under the one before; T9 449:299 to 449:313 6 apart.
const body = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
  phone: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
}

export type ToolkitCallsPerDayProps = {
  perDay: ToolkitActivityCounts['perDay']
  layout: Viewport
}

export function ToolkitCallsPerDay({ perDay, layout }: ToolkitCallsPerDayProps) {
  const last = perDay.series.length - 1
  return (
    <section className={fill} aria-label={perDay.label} data-figma={panelLayer(perDay.label, layout)}>
      <Panel>
        <div className={body[layout]}>
          <ToolkitEvalsHeader label={perDay.label} end={{ type: 'note', label: perDay.meta }} />
          {perDay.series.map((s, i) => (
            <div key={s.source} data-figma={layout === 'desktop' ? `chart · ${s.name}` : undefined}>
              <DailyBarChart
                label={`${s.name} per day`}
                legend={s.name}
                valueLabel="calls"
                tone={seriesTone(s.source)}
                data={dailyBars(perDay, i)}
                axisLabels={axisLabels(layout, i === last)}
              />
            </div>
          ))}
        </div>
      </Panel>
    </section>
  )
}
