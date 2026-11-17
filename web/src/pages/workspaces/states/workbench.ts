// Figma Workbench D1: D1 · Workbench. An empty page: only the page title (d-105); the workbench loop builds the frame.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'

export const workbench = {
  title: 'The Workspaces page before it is built',
  frames: [{ id: 'D1', node: '105:5', viewport: 'desktop' }],
  data: { title: 'Workspaces' },
  ui: {},
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
