// Projects T10 (references/projects/T10, a PNG reference: Figma
// yJaVpShE9RVoQwUeUBnMQ4 node 40:2, d-133): The Projects home on an iPad in portrait, every menu
// closed. Its tab bar draws 9 on Inbox. The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

export const projectsTablet = {
  title: 'The Projects home on an iPad in portrait',
  frames: [{ id: 'T10', node: '40:2', viewport: 'tablet' }],
  data: { ...menuOpen.data, railBadge: 9 },
  ui: {},
} satisfies ScreenState<ProjectsData, ProjectsUi>
