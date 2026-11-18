// Figma Toolkit T23 "T23 · A hook’s activity": the hook commit-msg open on
// the iPad mini on its Activity tab, with D24's data (hookActivity), under
// the hook's header, as T27 is. Copy word for word from
// references/toolkit/T23/frame.json; every string is D24's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { hookActivity } from './hookActivity.ts'

export const hookActivityTablet = {
  title: 'a hook’s activity on a tablet, under the hook’s header',
  frames: [{ id: 'T23', node: '491:7806', viewport: 'tablet' }],
  data: { ...hookActivity.data },
  ui: { ...hookActivity.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
