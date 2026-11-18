// The Evals tab's view (D20 `evals` 482:1894): how a badge looks for its
// state, the panels' labels with their counts, the text at the end of the
// rounds panel's header, whether the chart and the cases sit side by side,
// the chart's series for the library's GroupedBarChart, and the ui change of
// a tap that opens another item on its Evals tab. Pure, so evalsView.test.ts
// checks it without rendering.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitEvals, ToolkitUi } from '../types.ts'

type Badge = NonNullable<ToolkitEvals['status']['badges']>[number]
type Cases = NonNullable<ToolkitEvals['cases']>
type Rounds = NonNullable<ToolkitEvals['rounds']>
type Chart = NonNullable<ToolkitEvals['chart']>

/**
 * How a badge of the status panel is drawn (D20 482:1901 to 482:1923): a criterion that passes in the done colour with
 * a check, one that fails in the danger colour with a cross in a circle, one that waits in the needs-you colour with no
 * icon.
 */
export function badgeLook(state: Badge['state']): {
  tone: 'done' | 'danger' | 'needsYou'
  icon: 'check' | 'cross' | null
} {
  if (state === 'pass') return { tone: 'done', icon: 'check' }
  if (state === 'fail') return { tone: 'danger', icon: 'cross' }
  return { tone: 'needsYou', icon: null }
}

/**
 * A badge's state as text for assistive technology, after its label ("D1 Quality failed"): the library's Badge hides
 * its icon, so the colour and the icon alone would not say it. None when the label already ends with it (D20 "D6 Real
 * use · waits", D28 "43 of 43 pass").
 */
export function badgeResult(badge: Pick<Badge, 'label' | 'state'>): string | null {
  const last = badge.label.trim().split(' ').at(-1)
  if (last === badge.state) return null
  if (badge.state === 'pass') return 'passed'
  if (badge.state === 'fail') return 'failed'
  return 'waits'
}

/**
 * The Figma key of a badge: `badge · ` and its label (D20 `badge · D1 Quality` 482:1901), or only the criterion's
 * number for one that waits (`badge · D6` 482:1923, "D6 Real use · waits").
 */
export function badgeLayer(badge: Pick<Badge, 'label' | 'state'>): string {
  return badge.state === 'waits' ? `badge · ${badge.label.split(' ')[0] ?? badge.label}` : `badge · ${badge.label}`
}

/** The cases panel's label with how many rows it has, such as "Cases · 5" (D20 482:1958, shown in capitals). */
export function casesLabel(cases: Cases): string {
  return `${cases.label} · ${String(cases.rows.length)}`
}

/**
 * The text at the end of the rounds panel's header and what a tap on it does: the count of its rows ("4 ledgers", D25
 * 492:489, no tap), a tab of the item ("from the file", D27 492:1660, opens Files) or a link that waits for a design
 * ("Open the ledger", D20 482:1986: the ledger is outside the toolkit and no frame draws it, so it is disabled).
 */
export function roundsEnd(
  rounds: Rounds,
):
  | { label: string; action: 'none' }
  | { label: string; action: 'tab'; tab: string }
  | { label: string; action: 'waits' }
  | null {
  const end = rounds.end
  if (end === undefined) return null
  if (end.type === 'count') return { label: `${String(rounds.items.length)} ${end.noun}`, action: 'none' }
  if (end.type === 'tab') return { label: end.label, action: 'tab', tab: end.tab }
  return { label: end.label, action: 'waits' }
}

/**
 * Whether the chart and the cases sit side by side (D20 `row · chart and cases` 482:1926: two panels 468 wide, 12
 * apart): on the desktop when the tab has both. On a tablet or phone (T16, M18), or with only one of them (D26, D28),
 * the panels stand one under the other, each as wide as the tab.
 */
export function evalsRow(evals: ToolkitEvals, layout: Viewport): 'pair' | 'stack' {
  return layout === 'desktop' && evals.chart !== undefined && evals.cases !== undefined ? 'pair' : 'stack'
}

/** The chart's series for GroupedBarChart: the first in the accent colour (with the skill), the others grey. */
export function chartSeries(chart: Chart): { name: string; tone: 'accent' | 'muted' }[] {
  return chart.series.map((s, i) => ({ name: s.name, tone: i === 0 ? 'accent' : 'muted' }))
}

/**
 * The ui change of a tap that opens another item on its Evals tab, from the open item: a criterion's badge (D20 D5
 * Reviewer opens the agent writing-reviewer, D26; on a tablet the breadcrumb Toolkit › writer › writing-reviewer, T25)
 * or a ledger's skill (D25 writer opens D20). The file and line of a Files tab do not carry over. An item with no Evals
 * tab opens on its first tab (`openItem`).
 */
export function openEvals(path: string, from: string): Partial<ToolkitUi> {
  return {
    open: path,
    from: path === from ? null : from,
    itemTab: 'evals',
    file: undefined,
    fileView: undefined,
    filePage: undefined,
    line: undefined,
  }
}
