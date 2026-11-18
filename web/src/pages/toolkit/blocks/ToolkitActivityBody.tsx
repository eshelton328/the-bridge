// The counts of the Activity view under its source switch (Figma `activity`,
// D11 444:498): the key figures (`ToolkitActivityKpis` with the view's keys),
// then on the desktop two rows of two panels, the runs beside the calls per
// day (`row · now and per day` 444:520) and Most called beside the log
// (`row · most called and log` 444:617), and the source line under them, 16
// apart. On a tablet or phone (T9, M10) the runs, the calls per day and Most
// called stand one under the other in the view's column, with no log and no
// source line. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityCounts } from '../types.ts'
import { activityViewLayout, kpiViewLayer } from './activityPage.ts'
import { ToolkitActivityKpis } from './ToolkitActivityKpis.tsx'
import { ToolkitActivityLog } from './ToolkitActivityLog.tsx'
import { ToolkitActivityRuns } from './ToolkitActivityRuns.tsx'
import { ToolkitCallsPerDay } from './ToolkitCallsPerDay.tsx'
import { ToolkitMostCalled } from './ToolkitMostCalled.tsx'

const root = css({ display: 'flex', flexDirection: 'column', gap: '16', minW: '[0]' })
const pair = css({ display: 'grid', gridTemplateColumns: '[1fr 1fr]', alignItems: 'stretch', gap: '16' })
const source = css({ textStyle: 'small', color: 'fg.muted', m: '0' })

export type ToolkitActivityBodyProps = {
  counts: ToolkitActivityCounts
  layout: Viewport
  /** The id of the open run (D12). */
  openRun?: string | undefined
  onOpenRun?: ((id: string) => void) | undefined
  /** Opens a Most called item on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitActivityBody({ counts, layout, openRun, onOpenRun, onOpenItem }: ToolkitActivityBodyProps) {
  const view = activityViewLayout(layout)
  const kpis = <ToolkitActivityKpis kpis={counts.kpis} layout={layout} layer={kpiViewLayer} gap={view.kpiGap} />
  const runs = <ToolkitActivityRuns running={counts.running} layout={layout} open={openRun} onOpen={onOpenRun} />
  const perDay = <ToolkitCallsPerDay perDay={counts.perDay} layout={layout} />
  const mostCalled = <ToolkitMostCalled mostCalled={counts.mostCalled} layout={layout} onOpen={onOpenItem} />
  if (!view.panels) {
    // A tablet or phone: each part is a child of the view's column, so its gap spaces them.
    return (
      <>
        {kpis}
        {runs}
        {perDay}
        {mostCalled}
      </>
    )
  }
  return (
    <div className={root} data-figma="activity">
      {kpis}
      <div className={pair} data-figma="row · now and per day">
        {runs}
        {perDay}
      </div>
      <div className={pair} data-figma="row · most called and log">
        {mostCalled}
        {counts.log === undefined ? null : <ToolkitActivityLog log={counts.log} />}
      </div>
      {counts.source === undefined ? null : (
        <p className={source} data-figma="source note">
          {counts.source}
        </p>
      )}
    </div>
  )
}
