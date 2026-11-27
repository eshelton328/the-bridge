// Projects M10 (references/projects/M10, a PNG reference: Figma
// yJaVpShE9RVoQwUeUBnMQ4 node 42:2, d-133): The Projects home on the phone, every menu
// closed. Its tab bar draws no Inbox count. The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

export const projectsPhone = {
  title: 'The Projects home on the phone',
  frames: [{ id: 'M10', node: '42:2', viewport: 'phone' }],
  data: { ...menuOpen.data, railBadge: 0 },
  ui: {},
} satisfies ScreenState<ProjectsData, ProjectsUi>
