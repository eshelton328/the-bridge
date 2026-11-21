// A pane header's model as text: the model, and its effort after it when
// the header has one, as Figma writes "Sonnet 5.5 · high effort" (W5).
import type { PaneHead } from '../types.ts'

export const modelText = (head: PaneHead): string =>
  head.effort === undefined ? head.model : `${head.model} · ${head.effort}`
