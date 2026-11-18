// Figma Toolkit D28 "D28 · A hook’s evals": the hook commit-msg open beside
// the list, as in D9 (hookOpen), on its Evals tab. A hook has tests, not
// evals: the status panel gives the last test run as a badge, and the panel
// under it the test groups with their cases. Copy word for word from
// references/toolkit/D28/frame.json (shared/evals.ts); the list is D9's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'
import { withEvals } from './shared/evals.ts'

export const hookEvals = {
  title: 'a hook open beside the list, on Evals',
  frames: [{ id: 'D28', node: '492:1692', viewport: 'desktop' }],
  data: { ...hookOpen.data, details: withEvals(hookOpen.data.details) },
  ui: { ...hookOpen.ui, itemTab: 'evals' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
