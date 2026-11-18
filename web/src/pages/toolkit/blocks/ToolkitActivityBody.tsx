// The counts of the Activity view under its source switch (Figma `activity`,
// D11 444:498): the key figures (`ToolkitActivityKpis` with the view's keys),
// then on the desktop two rows of two panels, the runs beside the calls per
// day (`row · now and per day` 444:520) and Most called beside the log
// (`row · most called and log` 444:617), and the source line under them, 16
// apart. Chats and Headless runs (D15, D16) put their own list
// (`ToolkitActivitySourceList`) in the log's place, before Most called. On a
// tablet or phone (T9, M10, T11, T12, M13, M14) the runs, the calls per day,
// the list and Most called stand one under the other in the view's column,
// with no log and no source line. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityCounts } from '../types.ts'
import { activityViewLayout, kpiViewLayer } from './activityPage.ts'
import { ToolkitActivityKpis } from './ToolkitActivityKpis.tsx'
import { ToolkitActivityLog } from './ToolkitActivityLog.tsx'
import { ToolkitActivityRuns } from './ToolkitActivityRuns.tsx'
import { ToolkitActivitySourceList } from './ToolkitActivitySourceList.tsx'
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
  /** Opens a Most called item, or an item a chat or an eval names, on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
  /** Show all under the source's list was pressed. */
  showAll?: boolean | undefined
  onShowAll?: (() => void) | undefined
  /** The id of the open chat (D18). */
  openChat?: string | undefined
  onOpenChat?: ((id: string) => void) | undefined
  /** Opens an eval's skill on its Evals tab, by its path. */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitActivityBody({
  counts,
  layout,
  openRun,
  onOpenRun,
  onOpenItem,
  showAll,
  onShowAll,
  openChat,
  onOpenChat,
  onOpenEvals,
}: ToolkitActivityBodyProps) {
  const view = activityViewLayout(layout)
  const kpis = <ToolkitActivityKpis kpis={counts.kpis} layout={layout} layer={kpiViewLayer} gap={view.kpiGap} />
  const runs = <ToolkitActivityRuns running={counts.running} layout={layout} open={openRun} onOpen={onOpenRun} />
  const perDay = <ToolkitCallsPerDay perDay={counts.perDay} layout={layout} />
  const mostCalled = <ToolkitMostCalled mostCalled={counts.mostCalled} layout={layout} onOpen={onOpenItem} />
  const list =
    counts.list === undefined ? null : (
      <ToolkitActivitySourceList
        list={counts.list}
        layout={layout}
        showAll={showAll}
        onShowAll={onShowAll}
        openChat={openChat}
        onOpenChat={onOpenChat}
        onOpenItem={onOpenItem}
        onOpenEvals={onOpenEvals}
      />
    )
  if (!view.panels) {
    // A tablet or phone: each part is a child of the view's column, so its gap spaces them.
    return (
      <>
        {kpis}
        {runs}
        {perDay}
        {list}
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
        {list ?? mostCalled}
        {list === null ? counts.log === undefined ? null : <ToolkitActivityLog log={counts.log} /> : mostCalled}
      </div>
      {counts.source === undefined ? null : (
        <p className={source} data-figma="source note">
          {counts.source}
        </p>
      )}
    </div>
  )
}
