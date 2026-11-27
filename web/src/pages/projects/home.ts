// The Projects page as the app opens it, with no ?state= (lib/dataSource.ts):
// D10's projects with every menu and the More drawer closed, laid out by the
// window's width (D10's grid on a desktop, two columns on a tablet, one on a
// phone). It is not a state: it lives outside states/, so it has no frame,
// story, board or fidelity check.
import type { ScreenState } from '../../lib/screenState.ts'
import { menuOpen } from './states/menuOpen.ts'
import type { ProjectsData, ProjectsUi } from './types.ts'

export const projectsHome = {
  title: 'Projects as the app opens',
  frames: [],
  data: { ...menuOpen.data },
  ui: {},
} satisfies ScreenState<ProjectsData, ProjectsUi>
