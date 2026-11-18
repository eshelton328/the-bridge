// Figma Toolkit M18 "M18 · A skill’s evals": the skill writer open on the
// phone on its Evals tab, with T16's data (skillEvalsTablet: the back row
// names the item, Toolkit › writer, and the title sits over the tabs). The
// status panel's header is shorter on the phone (M18 482:2567 and 482:2569),
// and its badges wrap to a second row. Copy word for word from
// references/toolkit/M18/frame.json; the other strings are T16's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillEvalsTablet } from './skillEvalsTablet.ts'

export const skillEvalsPhone = {
  title: 'a skill’s evals on the phone, the badges in two rows',
  frames: [{ id: 'M18', node: '482:2359', viewport: 'phone' }],
  data: {
    ...skillEvalsTablet.data,
    details: skillEvalsTablet.data.details.map((d) =>
      d.path === 'skills/writer/' && d.results !== undefined
        ? {
            ...d,
            results: {
              ...d.results,
              status: { ...d.results.status, label: 'V1 done criteria', meta: 'x1, Codex grader' },
            },
          }
        : d,
    ),
  },
  ui: { ...skillEvalsTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
