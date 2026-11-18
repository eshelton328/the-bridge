// Where each card and arrow of a workflow's page flow sits (D13), and the
// step its panel shows. On the desktop the stages run left to right, each a
// column of four equal rows 32 apart: a stage's one step spans the middle two
// rows, and the two steps of a parallel stage the top two and the bottom two,
// so every card has one height and a single step sits level with the gap
// between two parallel ones. An arrow between two stages sits at the rows of
// the stage with more steps. Pure, so flowView.test.ts checks it without
// rendering.
import type { ToolkitItemDetailView } from '../types.ts'

export type FlowPage = NonNullable<ToolkitItemDetailView['flowPage']>
export type FlowPageStep = FlowPage['stages'][number][number]
/** The rows of a stage's column a card or an arrow spans. */
export type FlowRows = '1/3' | '2/4' | '3/5'

/** The selected step: the one with the id in `ui.flowStep`, else the first step with fields, else none. */
export function selectedStep(page: FlowPage, id: string | undefined): FlowPageStep | null {
  const steps = page.stages.flat()
  return steps.find((s) => s.id === id) ?? steps.find((s) => s.fields !== undefined && s.fields.length > 0) ?? null
}

/** The rows of each card of a stage: one step in the middle, two steps at the top and the bottom. */
export function stepRows(size: number): readonly FlowRows[] {
  return size === 1 ? ['2/4'] : ['1/3', '3/5']
}

/** The rows of the arrows from one stage to the next: at the cards of the stage with more steps. */
export function arrowRows(from: number, to: number): readonly FlowRows[] {
  return stepRows(Math.max(from, to))
}

/** The heading of a step's panel, such as "Step 4 · Primary grades"; a gate or an end has no number. */
export function stepHeading(step: Pick<FlowPageStep, 'type' | 'mark' | 'title'>): string {
  return step.type === 'step' ? `Step ${step.mark} · ${step.title}` : step.title
}

/**
 * The arrow between two stages of the column a tablet or phone draws (T8): `fork` into a parallel stage (an arrow over
 * each of its steps, 502:2), `join` out of one (one arrow in the middle, 502:8), `down` between two single steps
 * (448:223).
 */
export type ColumnArrow = 'down' | 'fork' | 'join'

export function columnArrow(from: number, to: number): ColumnArrow {
  if (to > 1 && from === 1) return 'fork'
  if (from > 1) return 'join'
  return 'down'
}
