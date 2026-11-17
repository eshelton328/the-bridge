// One step card of a workflow's flow (Figma `step · Runs`, D8 458:25): the
// step's mark (its number, or "?" for a gate and "×" for an end) and title
// on the top row, then what it runs in mono (a script in the accent colour,
// an agent in the agent kind's colour) and its notes in small text. Every
// card of a flow has the same size: the flow's grid makes its rows equal.
// A gate has the needs-you border, tint and title; an end the needs-you
// title and a dashed needs-you border. The library has no step card that
// fits (LIBRARY_GAPS.md, Workflow flow by phase): `FlowDiagram` numbers its
// steps itself and puts the body beside the number, so the card is drawn
// here with the FlowDiagram card's tokens. Props only.
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
const gate = css.raw({ borderColor: 'status.needsYou.border', bg: 'status.needsYou.faint' })
const end = css.raw({ borderColor: 'status.needsYou.border', borderStyle: 'dashed' })
// D8 458:12: the mark (22 × 19) and the title 7 apart; the lines start 3 under the row.
const top = css({ display: 'flex', alignItems: 'center', gap: '8', pb: '2' })
const title = css({ textStyle: 'label', color: 'fg.default', whiteSpace: 'nowrap' })
const amber = css({ color: 'status.needsYou.fg' })
const note = css({ textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' })
const uses = {
  code: css({ textStyle: 'mono', color: 'fg.accent', whiteSpace: 'nowrap' }),
  agent: css({ textStyle: 'mono', color: 'kind.agent', whiteSpace: 'nowrap' }),
}

export type ToolkitFlowStepProps = {
  step: Step
  /** The grid cell the card takes, from the flow. */
  className?: string | undefined
}

export function ToolkitFlowStep({ step, className }: ToolkitFlowStepProps) {
  const marked = step.type !== 'step'
  return (
    <div
      // css() merges the raw styles, so a gate's or an end's border wins over the card's.
      className={cx(css(card, step.type === 'gate' ? gate : {}, step.type === 'end' ? end : {}), className)}
      data-figma={`step · ${step.title}`}
    >
      <div className={top}>
        {/* D8 458:13: the number in a bordered mono box; a gate's "?" in the needs-you tint. */}
        {step.type === 'gate' ? (
          <Badge variant="tag" tone="needsYou" label={step.mark} />
        ) : (
          <Badge variant="outline" label={step.mark} />
        )}
        <h4 className={cx(title, marked ? amber : undefined)}>{step.title}</h4>
      </div>
      {step.uses === undefined ? null : <span className={uses[step.uses.kind]}>{step.uses.text}</span>}
      {step.notes.map((n) => (
        <span key={n} className={note}>
          {n}
        </span>
      ))}
    </div>
  )
}
