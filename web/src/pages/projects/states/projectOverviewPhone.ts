// Projects M01 (references/projects/M01, a PNG reference of the saved design
// render ov-M01.dc.html, d-133): NCC-1701's page on the phone, on its Overview tab.
// Its tab bar draws no Inbox count. Its Inbox and Queue panels are D01's.
// The data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'
import { overviewRows } from './projectOverview.ts'

export const projectOverviewPhone = {
  title: "NCC-1701's page on the phone, on its Overview tab",
  frames: [{ id: 'M01', node: 'ov-M01.dc.html', viewport: 'phone' }],
  data: { ...menuOpen.data, railBadge: 0, overview: overviewRows },
  ui: { open: 'ncc-1701' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
