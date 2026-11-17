// Figma Toolkit D1: D1 · Toolkit. An empty page: only the page title (d-105); the toolkit loop builds the frame.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'

export const toolkitList = {
  title: 'The Toolkit page before it is built',
  frames: [{ id: 'D1', node: '424:6', viewport: 'desktop' }],
  data: { title: 'Toolkit' },
  ui: {},
} satisfies ScreenState<ToolkitData, ToolkitUi>
