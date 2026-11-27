// Projects T01b (references/projects/T01b, a PNG reference of the saved design
// render ov-L01.dc.html, d-133): NCC-1701's page on an iPad in landscape, on its
// Overview tab; at 1133 px the app draws the tablet layout.
// Its tab bar draws no Inbox count. Its Inbox and Queue panels are D01's.
// The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'
import { overviewRows } from './projectOverview.ts'

export const projectOverviewTabletWide = {
  title: "NCC-1701's page on an iPad in landscape, on its Overview tab",
  frames: [{ id: 'T01b', node: 'ov-L01.dc.html', viewport: 'tablet' }],
  data: { ...menuOpen.data, railBadge: 0, overview: overviewRows },
  ui: { open: 'ncc-1701' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
