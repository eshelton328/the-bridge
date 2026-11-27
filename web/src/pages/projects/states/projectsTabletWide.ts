// Projects T10b (references/projects/T10b, a PNG reference: Figma
// yJaVpShE9RVoQwUeUBnMQ4 node 39:2, d-133): The Projects home on an iPad in landscape, every menu
// closed. Its rail draws 9 on Inbox; at 1133 px, narrower than the desktop layout's 1232, the app draws the tablet layout. The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

export const projectsTabletWide = {
  title: 'The Projects home on an iPad in landscape',
  frames: [{ id: 'T10b', node: '39:2', viewport: 'tablet' }],
  data: { ...menuOpen.data, railBadge: 9 },
  ui: {},
} satisfies ScreenState<ProjectsData, ProjectsUi>
