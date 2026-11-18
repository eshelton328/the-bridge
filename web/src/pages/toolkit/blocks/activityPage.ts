// The Activity view of the page (D11 `activity` 444:498, D12, T9, M10): which
// source's counts it shows, which sources the switch can pick, the rows the
// kind chip leaves, the open run, what each tap changes in the ui, the days
// of a calls-per-day chart and the Figma key of each part. Pure, so
// activityPage.test.ts checks it without rendering.
import type { DailyAxisLabels, DailyBar } from '@eshelton328/component-library-1701'
import type { Viewport } from '../../../lib/screenState.ts'
import type {
  ToolkitActivityCounts,
  ToolkitActivitySource,
  ToolkitActivityView,
  ToolkitRun,
  ToolkitUi,
  ToolkitView,
} from '../types.ts'
import { narrowList } from './activitySources.ts'

/** The source the view counts: `ui.activitySource`, or All when not set or when that source has no counts yet. */
export function activitySource(
  view: ToolkitActivityView,
  ui: Pick<ToolkitUi, 'activitySource'>,
): ToolkitActivitySource {
  const picked = ui.activitySource ?? 'all'
  return view.counts[picked] === undefined ? 'all' : picked
}

/**
 * The counts the view shows for the picked source, narrowed by the kind chip: a kind other than All keeps only its
 * runs, its most called items, its log lines and the rows of its list that name it (the key figures and the calls per
 * day count every kind). None when the view has no counts for All.
 */
export function activityCounts(
  view: ToolkitActivityView,
  ui: Pick<ToolkitUi, 'activitySource' | 'filter'>,
): ToolkitActivityCounts | undefined {
  const counts = view.counts[activitySource(view, ui)]
  if (counts === undefined || ui.filter === 'all') return counts
  const kind = ui.filter
  return {
    ...counts,
    running: { ...counts.running, rows: counts.running.rows.filter((r) => r.kind === kind) },
    mostCalled: { ...counts.mostCalled, rows: counts.mostCalled.rows.filter((r) => r.kind === kind) },
    ...(counts.log === undefined
      ? {}
      : { log: { ...counts.log, rows: counts.log.rows.filter((r) => r.kind === kind) } }),
    ...(counts.list === undefined ? {} : { list: narrowList(counts.list, kind) }),
  }
}

/** The source switch's items (D11 `source · segmented` 444:491): a source with no counts yet is disabled. */
export function sourceItems(
  view: ToolkitActivityView,
): { value: ToolkitActivitySource; label: string; disabled: boolean }[] {
  return view.sources.map((s) => ({ value: s.value, label: s.label, disabled: view.counts[s.value] === undefined }))
}

/** The run open in the view (D12): the row whose id `ui.run` names, among all the source's rows; else null. */
export function openRun(view: ToolkitActivityView, ui: Pick<ToolkitUi, 'activitySource' | 'run'>): ToolkitRun | null {
  if (ui.run === undefined) return null
  const counts = view.counts[activitySource(view, ui)]
  return counts?.running.rows.find((r) => r.id === ui.run) ?? null
}

/** A tap on a run or its Open session (D11 to D12): the run opens, in the open chat's place. */
export function showRun(id: string): Partial<ToolkitUi> {
  return { run: id, chat: undefined }
}

/** Close on the run's panel, or Back on its page: the view again (D12 to D11). */
export function closeRun(): Partial<ToolkitUi> {
  return { run: undefined }
}

/** A tap on a Most called item: it opens on its page, as a tap on its card in the list opens it (D3). */
export function openCalled(path: string): Partial<ToolkitUi> {
  return { view: 'list', open: path, from: null, run: undefined, chat: undefined }
}

/** Another view from the switch, or the tablet's Back to Toolkit (T9): no run or chat stays open, and the list folds. */
export function changeView(view: ToolkitView): Partial<ToolkitUi> {
  return { view, run: undefined, chat: undefined, activityShowAll: undefined }
}

/** The days of one series as the library's DailyBarChart takes them: each day's date, label and count. */
export function dailyBars(perDay: ToolkitActivityCounts['perDay'], index: number): DailyBar[] {
  const values = perDay.series[index]?.values ?? []
  return perDay.days.map((d, i) => ({ date: d.date, label: d.label, value: values[i] ?? 0 }))
}

/** The bar colour of a series: the headless runs violet and the chats cyan (D11 444:588 and 444:599). */
export function seriesTone(source: ToolkitActivityCounts['perDay']['series'][number]['source']): 'running' | 'accent' {
  return source === 'headless' ? 'running' : 'accent'
}

/**
 * The days the axis under a chart names: none under a chart with another under it, the first, middle and last under
 * the last chart on the desktop (D11 `axis` 444:611: Oct 31, Nov 7, Nov 15), the first and last on a tablet or phone
 * (T9 449:326).
 */
export function axisLabels(layout: Viewport, last: boolean): DailyAxisLabels {
  if (!last) return 'none'
  return layout === 'desktop' ? 'endsAndMiddle' : 'ends'
}

/**
 * How the view lays out on a layout: the key figures four in a row 12 apart (D11 `kpis` 444:499), four 8 apart on a
 * tablet (T9 449:249) or two by two 8 apart on the phone (M10 449:555); the panels two to a row on the desktop
 * (D11 `row · now and per day` 444:520) and one under the other elsewhere, where the runs are rows with no panel.
 */
export function activityViewLayout(layout: Viewport): { kpiColumns: 2 | 4; kpiGap: '8' | '12'; panels: boolean } {
  if (layout === 'desktop') return { kpiColumns: 4, kpiGap: '12', panels: true }
  if (layout === 'tablet') return { kpiColumns: 4, kpiGap: '8', panels: false }
  return { kpiColumns: 2, kpiGap: '8', panels: false }
}

/** The Figma key of a key figure: `kpi · ` and its label (D11 `kpi · toolkit calls` 444:500). */
export function kpiViewLayer(kpi: { label: string }): string {
  return `kpi · ${kpi.label}`
}

/** The Figma key of a run's row: `run · ` and its name (D11 `run · writing-reviewer` 444:526). */
export function runLayer(run: Pick<ToolkitRun, 'name'>): string {
  return `run · ${run.name}`
}

/** The Figma key of a Most called item: `bar · ` and its name (D11 `bar · writer` 444:638). */
export function calledLayer(item: { name: string }): string {
  return `bar · ${item.name}`
}

/** The Figma key of a log line: `log · ` and its time (D11 `log · 01:16:40` 444:694). */
export function logLayer(line: { time: string }): string {
  return `log · ${line.time}`
}

/**
 * The Figma key of a panel: its label in capitals on the desktop (D11 `panel · RUNNING NOW` 444:521), in small
 * letters on a tablet or phone (T9 `panel · calls per day` 449:298).
 */
export function panelLayer(label: string, layout: Viewport): string {
  return `panel · ${layout === 'desktop' ? label.toUpperCase() : label.toLowerCase()}`
}
