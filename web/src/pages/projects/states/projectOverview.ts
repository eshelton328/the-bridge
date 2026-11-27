// Projects D01 (references/projects/D01, a PNG reference of the saved design
// render ov-D01.dc.html, d-133): NCC-1701's page on the desktop, on its
// Overview tab: Back to Projects, the letter tile, the name, the purpose,
// Quick chat and the tabs Overview and Ideas. The Overview's panels are
// NCC-130's. The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

export const projectOverview = {
  title: "NCC-1701's page on the desktop, on its Overview tab",
  frames: [{ id: 'D01', node: 'ov-D01.dc.html', viewport: 'desktop' }],
  data: menuOpen.data,
  ui: { open: 'ncc-1701' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
