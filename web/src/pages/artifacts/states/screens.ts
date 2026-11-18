// The Artifacts page's screens (screen review R10): the states that draw
// each screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/ArtifactsScreens.stories.tsx. Every state is in
// exactly one screen (states/screens.test.ts).
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { artifactsStates } from './index.ts'

export const artifactsScreens = {
  library: { title: 'The library', desktop: 'library', tablet: 'libraryTablet', phone: 'libraryPhone' },
  artifact: { title: 'An open artifact', desktop: 'artifactOpen', tablet: 'artifactTablet', phone: 'artifactPhone' },
  filter: { title: 'The filter', desktop: 'filterOpen', tablet: 'filterTablet', phone: 'filterPhone' },
  sort: { title: 'The sort', desktop: 'sortOpen', phone: 'sortPhone' },
  search: { title: 'A search', desktop: 'searchList', phone: 'searchPhone' },
  addLink: { title: 'Add a link', desktop: 'addLink', phone: 'addLinkPhone' },
  discussion: { title: 'The discussion', desktop: 'discussOpen', tablet: 'discussTablet', phone: 'discussPhone' },
  changeProposed: {
    title: 'A proposed update',
    desktop: 'changeProposed',
    tablet: 'changeProposedTablet',
    phone: 'changeProposedPhone',
  },
  changeApplied: { title: 'The update applied', desktop: 'changeApplied' },
  fileInProject: { title: 'File in a project', phone: 'filePhone' },
  more: { title: 'The More drawer', phone: 'morePhone' },
} as const satisfies ScreenMap<keyof typeof artifactsStates>
