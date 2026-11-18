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
// with a line that is too long wrapping in the card. On a workflow's page (D13
// `step · Runs` 447:9, `variant="page"`) the card's lines wrap in its width,
// a line in amber says what runs after the step (`then`), and the title is a
// button that selects the step: the selected card has the selected fill and
// border. Props only.
import { Badge } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

type Step = Pick<
  NonNullable<ToolkitItemDetailView['flow']>['phases'][number]['steps'][number],
  'mark' | 'title' | 'type' | 'uses' | 'notes'
> & { then?: string | undefined }

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
// D13 447:9: 150 × 128, the top row 11 in, the lines 5 under it and 5 apart (4), 20 under the tallest card's last line
// (447:8 ends at 539, the card at 559). The mark is 3 px taller than Figma's (a 22 px Badge), so 16 under the content
// keeps the cards 126 high. The card is a positioned box, so its title's button can cover it.
const cardPage = css.raw({ position: 'relative', gap: '4', pb: '16' })
// D13 447:31: the selected step (4) has the selected fill and border, as a selected row.
const selectedCard = css.raw({ bg: 'surface.selected', borderColor: 'border.selected' })
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
// D13: the page's lines wrap in the card (447:7, 447:36), and the line after the notes is amber (447:16).
const pageTop = css({ display: 'flex', alignItems: 'center', gap: '8' })
const pageLine = css({ textStyle: 'small', color: 'fg.muted' })
const pageThen = css({ textStyle: 'small', color: 'status.needsYou.fg' })
const pageUses = {
  code: css({ textStyle: 'mono', color: 'fg.accent' }),
  agent: css({ textStyle: 'mono', color: 'kind.agent' }),
}
// The title's button covers the card, so a click anywhere on it selects the step, as a list row's title does.
const select = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'start',
  cursor: 'pointer',
  outline: 'none',
  _after: { content: '""', position: 'absolute', inset: '0', borderRadius: 'lg' },
  _focusVisible: { _after: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' } },
})
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
  /** `lane` in D8's lanes; `page` on a workflow's page (D13): the lines wrap, and `then` and `onSelect` show. */
  variant?: 'lane' | 'page' | undefined
  /** The selected step on a workflow's page (D13). */
  selected?: boolean | undefined
  /** Selects the step; its title is then a button. */
  onSelect?: (() => void) | undefined
}

export function ToolkitFlowStep({
  step,
  className,
  size = 'md',
  variant = 'lane',
  selected = false,
  onSelect,
}: ToolkitFlowStepProps) {
  const marked = step.type !== 'step'
  const page = variant === 'page'
  return (
    <div
      // css() merges the raw styles, so a gate's or an end's border wins over the card's.
      className={cx(
        css(
          card,
          size === 'sm' ? cardSm : {},
          page ? cardPage : {},
          step.type === 'gate' ? gate : {},
          step.type === 'end' ? end : {},
          selected ? selectedCard : {},
        ),
        className,
      )}
      data-figma={`step · ${step.title}`}
    >
      <div className={page ? pageTop : top[size]}>
        {/* D8 458:13: the number in a bordered mono box; a gate's "?" in the needs-you tint. */}
        {step.type === 'gate' ? (
          <Badge variant="tag" tone="needsYou" label={step.mark} />
        ) : (
          <Badge variant="outline" label={step.mark} />
        )}
        <h4 className={cx(title[size], marked ? amber : undefined)}>
          {onSelect === undefined ? (
            step.title
          ) : (
            <button type="button" className={select} aria-pressed={selected} onClick={onSelect}>
              {step.title}
            </button>
          )}
        </h4>
      </div>
      {step.uses === undefined ? null : (
        <span className={page ? pageUses[step.uses.kind] : uses[size][step.uses.kind]}>{step.uses.text}</span>
      )}
      {step.notes.map((n) => (
        <span key={n} className={page ? pageLine : note[size]}>
          {n}
        </span>
      ))}
      {page && step.then !== undefined ? <span className={pageThen}>{step.then}</span> : null}
    </div>
  )
}
