// Figma Toolkit M30 "M30 · A hook’s evals": the hook commit-msg open on the
// phone on its Evals tab, with T27's data (hookEvalsTablet, D28's evals),
// under M22's header. Copy word for word from
// references/toolkit/M30/frame.json; every string is T27's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookEvalsTablet } from './hookEvalsTablet.ts'

export const hookEvalsPhone = {
  title: 'a hook’s evals on the phone, under the hook’s header',
  frames: [{ id: 'M30', node: '492:4744', viewport: 'phone' }],
  data: { ...hookEvalsTablet.data },
  ui: { ...hookEvalsTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
