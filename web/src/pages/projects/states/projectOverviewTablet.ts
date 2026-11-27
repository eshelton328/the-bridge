// Projects T01 (references/projects/T01, a PNG reference of the saved design
// render ov-T01.dc.html, d-133): NCC-1701's page on an iPad in portrait, on its
// Overview tab.
// Its tab bar draws no Inbox count. The Overview's panels are NCC-130's.
// The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

export const projectOverviewTablet = {
  title: "NCC-1701's page on an iPad in portrait, on its Overview tab",
  frames: [{ id: 'T01', node: 'ov-T01.dc.html', viewport: 'tablet' }],
  data: { ...menuOpen.data, railBadge: 0 },
  ui: { open: 'ncc-1701' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
