// Figma Toolkit T27 "T27 · A hook’s evals": the hook commit-msg open on the
// iPad mini on its Evals tab, with D28's data (hookEvals), under T19's header
// (Back to Toolkit, the kind badge, the name and the path row). Copy word for
// word from references/toolkit/T27/frame.json; every string is D28's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookEvals } from './hookEvals.ts'

export const hookEvalsTablet = {
  title: 'a hook’s evals on a tablet, under the hook’s header',
  frames: [{ id: 'T27', node: '492:3436', viewport: 'tablet' }],
  data: { ...hookEvals.data },
  ui: { ...hookEvals.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
