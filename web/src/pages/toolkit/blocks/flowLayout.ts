// Where each card and connector of a workflow's page flow sits (D13), and the
// step its panel shows. On the desktop the stages run left to right, each a
// column of four equal rows 32 apart: a stage's one step spans the middle two
// rows, and the two steps of a parallel stage the top two and the bottom two,
// so every card has one height and a single step sits level with the gap
// between two parallel ones. A line between two single stages sits at their
// rows, and a fork or a join spans the rows of the parallel stage. Pure, so flowView.test.ts checks it without
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
 * The connector between two stages (D13, T8): `fork` into a parallel stage (the library's `FlowBranch`, an arm into
 * each of its steps, 502:2), `join` out of one (its arms into one head, 502:8), `down` between two single steps (a
 * `FlowLine`, 448:223; across on the desktop, 447:74), `pair` between two parallel stages (a `FlowLine` from each
 * step into the one beside it in the next stage; no frame shows one, so a join there would point between the cards).
 */
export type ColumnArrow = 'down' | 'fork' | 'join' | 'pair'

export function columnArrow(from: number, to: number): ColumnArrow {
  if (from > 1 && to > 1) return 'pair'
  if (to > 1 && from === 1) return 'fork'
  if (from > 1) return 'join'
  return 'down'
}
