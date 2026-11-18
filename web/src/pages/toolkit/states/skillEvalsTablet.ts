// Figma Toolkit T16 "T16 · A skill’s evals": the skill writer open on the iPad
// mini on its Evals tab, with D20's data (skillEvals). On a tablet the item
// replaces the list, under the back row that names it (Toolkit › writer); its
// `results` sets `named`, so the kind badge and path rows are left out, as on
// T10 and T15. The chart and the cases stand one under the other. A tap on D5
// Reviewer opens the agent from writer (T25). Copy word for word from
// references/toolkit/T16/frame.json; every string is D20's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvals } from './skillEvals.ts'

export const skillEvalsTablet = {
  title: 'a skill’s evals on a tablet, the cases under the chart',
  frames: [{ id: 'T16', node: '482:2003', viewport: 'tablet' }],
  data: {
    ...skillEvals.data,
    details: skillEvals.data.details.map((d) =>
      d.path === 'skills/writer/' && d.results !== undefined ? { ...d, results: { ...d.results, named: true } } : d,
    ),
  },
  ui: { ...skillEvals.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
