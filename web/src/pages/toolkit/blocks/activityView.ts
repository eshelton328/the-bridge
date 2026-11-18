// The Activity tab's view (D17 `activity` 474:583): how many key figures
// stand in a row and whether they show their captions, whether the two bar
// panels sit side by side, the Figma key of each part, what a tap on a row
// of the list does, and how far the item's tabs scroll so the selected tab
// shows (M15: "The tabs scroll sideways"). Pure, so activityView.test.ts
// checks it without rendering.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivity } from '../types.ts'

type Kpi = ToolkitActivity['kpis'][number]
type Row = ToolkitActivity['list']['rows'][number]

/**
 * How the Activity tab lays out its panels on a layout: the key figures four in a row (D17 `kpis` 474:584, four 228
 * wide; T13 474:921, four 169 wide) or two by two on the phone (M15 474:1216, two 179 wide, 8 apart), each with its
 * caption except on the phone (M15 `panel · kpi calls` 474:1217 is 70 high, with no caption), and the bar panels side
 * by side on the desktop (D17 `row · day and where` 474:601, two 468 wide) or one under the other (T13 474:938).
 */
export function activityLayout(layout: Viewport): { kpiColumns: 2 | 4; captions: boolean; bars: 'pair' | 'stack' } {
  if (layout === 'desktop') return { kpiColumns: 4, captions: true, bars: 'pair' }
  if (layout === 'tablet') return { kpiColumns: 4, captions: true, bars: 'stack' }
  return { kpiColumns: 2, captions: false, bars: 'stack' }
}

/** A key figure's caption on a layout: none on the phone (M15). */
export function kpiCaption(kpi: Kpi, layout: Viewport): string | undefined {
  return activityLayout(layout).captions ? kpi.caption : undefined
}

/** The Figma key of a key figure's tile: `panel · kpi ` and its label (D17 `panel · kpi calls` 474:585). */
export function kpiLayer(kpi: Pick<Kpi, 'label'>): string {
  return `panel · kpi ${kpi.label}`
}

/** The Figma key of a row of the list: `row · ` and its title (D17 `row · Brain NC1701 project` 474:658). */
export function rowLayer(row: Pick<Row, 'title'>): string {
  return `row · ${row.title}`
}

/**
 * What a tap on a row of the list does: a round opens the skill it names on its Evals tab (D23 `row · writer ·
 * cross-family x1` opens writer, D20); a chat opens in the Activity view's chat panel (D18), which no state draws yet,
 * so it takes no tap.
 */
export function rowTap(row: Row): { action: 'openEvals'; path: string } | { action: 'none' } {
  return row.open === undefined ? { action: 'none' } : { action: 'openEvals', path: row.open }
}

/** A box along the x axis, as `getBoundingClientRect` gives it. */
type Span = { left: number; right: number }

/**
 * How far the tab list scrolls so its selected tab shows (M15 `item tabs` 474:1050: on the phone Activity is the last
 * tab, past the screen's edge, and Figma scrolls the list so it ends at the list's end): the new `scrollLeft`, or null
 * when the tab's middle is already in the list's box. A tab cut by a few px at the edge keeps the list where it is, so
 * the tabs before it stay at Figma's x; M18's Evals (319.5 to 376.4 since library #153) ends inside the list.
 */
export function tabScroll(list: Span & { scrollLeft: number }, tab: Span): number | null {
  const middle = (tab.left + tab.right) / 2
  if (middle >= list.left && middle <= list.right) return null
  const by = tab.right > list.right ? tab.right - list.right : tab.left - list.left
  return Math.max(0, list.scrollLeft + by)
}
