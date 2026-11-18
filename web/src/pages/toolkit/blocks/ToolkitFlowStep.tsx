// One step card of a workflow's flow (Figma `step · Runs`, D8 458:25): the
// step's mark (its number, or "?" for a gate and "×" for an end) and title
// on the top row, then what it runs in mono (a script in the accent colour,
// an agent in the agent kind's colour) and its notes in small text. Every
// card of a flow has the same size: the flow's grid makes its rows equal.
// A gate has the needs-you border and title on the card's fill; an end the needs-you
// title and a dashed needs-you border. The library has no step card that
// fits (LIBRARY_GAPS.md, Workflow flow by phase): `FlowDiagram` numbers its
// steps itself and puts the body beside the number, so the card is drawn
// here with the FlowDiagram card's tokens. On a tablet (T18 `step · Runs`
// 487:791) the card is smaller (`size="sm"`): less padding and smaller text,
// with a line that is too long wrapping in the card. Props only.
import { Badge } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

type Step = NonNullable<ToolkitItemDetailView['flow']>['phases'][number]['steps'][number]

// D8 458:25: 196 × 82, the top row 11 in, the lines 3 under it and 3 apart. The library's FlowDiagram card pads 12
// at the sides; 10 keeps each line on one line in the 196 px card (Figma 11).
const card = css.raw({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minW: '[0]',
  p: '10',
  bg: 'surface.raised',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
})
// T18 487:791: 147 × 62, the top row 8 in, the lines under it (13 high, 15 apart).
const cardSm = css.raw({ p: '6' })
const gate = css.raw({ borderColor: 'status.needsYou.border' })
const end = css.raw({ borderColor: 'status.needsYou.border', borderStyle: 'dashed' })
// D8 458:12: the mark (22 × 19) and the title 7 apart; the lines start 3 under the row.
// T18 487:792: the mark (16.5 × 14.5) and the title (16 high) 5 apart; the lines 2 under the row.
const top = {
  md: css({ display: 'flex', alignItems: 'center', gap: '8', pb: '2' }),
  sm: css({ display: 'flex', alignItems: 'center', gap: '6' }),
}
const title = {
  md: css({ textStyle: 'label', color: 'fg.default', whiteSpace: 'nowrap' }),
  sm: css({ textStyle: 'labelXs', color: 'fg.default', whiteSpace: 'nowrap' }),
}
const amber = css({ color: 'status.needsYou.fg' })
const note = {
  md: css({ textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' }),
  sm: css({ textStyle: 'smallXs', color: 'fg.muted' }),
}
const uses = {
  md: {
    code: css({ textStyle: 'mono', color: 'fg.accent', whiteSpace: 'nowrap' }),
    agent: css({ textStyle: 'mono', color: 'kind.agent', whiteSpace: 'nowrap' }),
  },
  sm: {
    code: css({ textStyle: 'monoSm', color: 'fg.accent' }),
    agent: css({ textStyle: 'monoSm', color: 'kind.agent' }),
  },
}

export type ToolkitFlowStepProps = {
  step: Step
  /** The grid cell the card takes, from the flow. */
  className?: string | undefined
  /** `md` on the desktop (D8); `sm` on a tablet (T18). */
  size?: 'md' | 'sm' | undefined
}

export function ToolkitFlowStep({ step, className, size = 'md' }: ToolkitFlowStepProps) {
  const marked = step.type !== 'step'
  return (
    <div
      // css() merges the raw styles, so a gate's or an end's border wins over the card's.
      className={cx(
        css(card, size === 'sm' ? cardSm : {}, step.type === 'gate' ? gate : {}, step.type === 'end' ? end : {}),
        className,
      )}
      data-figma={`step · ${step.title}`}
    >
      <div className={top[size]}>
        {/* D8 458:13: the number in a bordered mono box; a gate's "?" in the needs-you tint. */}
        {step.type === 'gate' ? (
          <Badge variant="tag" tone="needsYou" label={step.mark} />
        ) : (
          <Badge variant="outline" label={step.mark} />
        )}
        <h4 className={cx(title[size], marked ? amber : undefined)}>{step.title}</h4>
      </div>
      {step.uses === undefined ? null : <span className={uses[size][step.uses.kind]}>{step.uses.text}</span>}
      {step.notes.map((n) => (
        <span key={n} className={note[size]}>
          {n}
        </span>
      ))}
    </div>
  )
}
