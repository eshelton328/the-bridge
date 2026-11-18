// Figma Toolkit M26 "M26 · A hook’s activity": the hook commit-msg open on
// the phone on its Activity tab, with T23's data (hookActivityTablet), under
// M22's header. Copy word for word from references/toolkit/M26/frame.json;
// every string is T23's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookActivityTablet } from './hookActivityTablet.ts'

export const hookActivityPhone = {
  title: 'a hook’s activity on the phone, under the hook’s header',
  frames: [{ id: 'M26', node: '491:9182', viewport: 'phone' }],
  data: { ...hookActivityTablet.data },
  ui: { ...hookActivityTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
