// Every Figma state of the Projects page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { menuOpen } from './menuOpen.ts'
import { projectsTablet } from './projectsTablet.ts'
import { projectsTabletWide } from './projectsTabletWide.ts'
import { projectsPhone } from './projectsPhone.ts'
import { projectOverview } from './projectOverview.ts'
import { projectOverviewTablet } from './projectOverviewTablet.ts'
import { projectOverviewTabletWide } from './projectOverviewTabletWide.ts'

export const projectsStates = {
  menuOpen,
  projectsTablet,
  projectsTabletWide,
  projectsPhone,
  projectOverview,
  projectOverviewTablet,
  projectOverviewTabletWide,
}
