// The Projects page's screens (screen review R10): the states that draw
// each screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/ProjectsScreens.stories.tsx. Every state is in
// exactly one screen (states/screens.test.ts).
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { projectsStates } from './index.ts'

export const projectsScreens = {
  home: { title: 'The Projects home', desktop: 'menuOpen', tablet: 'projectsTablet', phone: 'projectsPhone' },
  wide: { title: 'The Projects home on an iPad in landscape', landscape: true, tablet: 'projectsTabletWide' },
  project: {
    title: "A project's page",
    desktop: 'projectOverview',
    tablet: 'projectOverviewTablet',
  },
  projectWide: {
    title: "A project's page on an iPad in landscape",
    landscape: true,
    tablet: 'projectOverviewTabletWide',
  },
} as const satisfies ScreenMap<keyof typeof projectsStates>
