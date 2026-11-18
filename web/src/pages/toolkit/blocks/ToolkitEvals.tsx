// The Evals tab of an open item (Figma `evals`, D20 482:1894): the status
// panel (`ToolkitEvalsStatus`), the chart and the cases side by side
// (`row · chart and cases` 482:1926: `ToolkitEvalsChart`,
// `ToolkitEvalsCases`), the rounds (`ToolkitEvalsRounds`) and the source of
// it all under them. An item with no eval cases shows what stands in for
// them: a rule the ledgers that cite it (D25), an agent its drafts from the
// writer ledger (D26), a workflow its gates (D27) and a hook its test groups
// (D28). On a tablet or phone (T16, M18) the chart and the cases stand one
// under the other (`evalsRow`). Props only.
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitEvals as Evals } from '../types.ts'
import { evalsRow } from './evalsView.ts'
import { ToolkitEvalsCases } from './ToolkitEvalsCases.tsx'
import { ToolkitEvalsChart } from './ToolkitEvalsChart.tsx'
import { ToolkitEvalsRounds } from './ToolkitEvalsRounds.tsx'
import { ToolkitEvalsStatus } from './ToolkitEvalsStatus.tsx'

// D20 482:1894: the panels and the source 12 apart (482:1895 ends at 325, the row starts at 337; the rounds end at
// 761, the source starts at 773).
const root = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// D20 482:1894: on the desktop the tab starts 16 under the tabs (482:1732 ends at 212); the tabs' panel puts it 14
// under them, so 2 more.
const rootDesktop = css({ mt: '2' })
// D20 482:1926: two panels 468 wide, 12 apart, each as tall as its content (482:1927 is 228 high, 482:1956 210).
const pair = css({ display: 'grid', gridTemplateColumns: '[1fr 1fr]', alignItems: 'start', gap: '12' })
// T16 482:2282: one under the other, 12 apart (482:2283 ends at 506, 482:2312 starts at 518).
const stack = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
const source = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitEvalsProps = {
  evals: Evals
  layout?: Viewport | undefined
  onTabChange?: ((tab: string) => void) | undefined
  /** Opens another item on its Evals tab, by its path: a criterion's badge (D5 Reviewer) or a ledger's skill. */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitEvals({ evals, layout = 'desktop', onTabChange, onOpenEvals }: ToolkitEvalsProps) {
  return (
    <section aria-label="Evals" className={layout === 'desktop' ? cx(root, rootDesktop) : root} data-figma="evals">
      <ToolkitEvalsStatus status={evals.status} onOpenEvals={onOpenEvals} />
      {evals.chart === undefined && evals.cases === undefined ? null : (
        <div className={evalsRow(evals, layout) === 'pair' ? pair : stack} data-figma="row · chart and cases">
          {evals.chart === undefined ? null : <ToolkitEvalsChart chart={evals.chart} />}
          {evals.cases === undefined ? null : <ToolkitEvalsCases cases={evals.cases} />}
        </div>
      )}
      {evals.rounds === undefined ? null : (
        <ToolkitEvalsRounds rounds={evals.rounds} onTabChange={onTabChange} onOpenEvals={onOpenEvals} />
      )}
      <p className={source}>{evals.source}</p>
    </section>
  )
}
