// The Artifacts page as the app opens it, with no ?state= (lib/dataSource.ts):
// D1's library with every card, laid out by the window's width (D1's grid
// on a desktop, T1's two columns on a tablet, M1's rows on a phone), and
// every menu, sheet and dialog closed. It holds what each layout's buttons
// open: T1's Filter menu (D3's, with the sheet's Clear and Show), so Filter
// opens D3's popover on a desktop and T3's sheet on a tablet or a phone,
// and D6's sorts and Sort menu, so Sort opens D6's menu or M4's sheet, and
// D5's Add a link form with no link and no title, and M6's words for the
// phone's sheet, so Add a link opens D5's dialog or M6's sheet empty. A card or row opens its artifact
// (screens/openView.ts). The
// search says "Search artifacts", T1's and M1's words, which fit the
// phone's field; D1's longer words are cut there. It is not a Figma state:
// it lives outside states/, so it has no frame, story, board or fidelity
// check.
import type { ScreenState } from '../../lib/screenState.ts'
import { addLink } from './states/addLink.ts'
import { addLinkPhone } from './states/addLinkPhone.ts'
import { artifactOpen } from './states/artifactOpen.ts'
import { library } from './states/library.ts'
import { libraryTablet } from './states/libraryTablet.ts'
import { sortOpen } from './states/sortOpen.ts'
import type { ArtifactsData, ArtifactsUi } from './types.ts'

export const artifactsHome = {
  title: 'Artifacts as the app opens',
  frames: [],
  data: {
    ...library.data,
    searchPlaceholder: libraryTablet.data.searchPlaceholder,
    filterMenu: libraryTablet.data.filterMenu,
    sorts: sortOpen.data.sorts,
    sortMenu: sortOpen.data.sortMenu,
    // D2's project menu, so an open artifact's project chip (or the phone's ⋯) opens it.
    fileMenu: artifactOpen.data.fileMenu,
    // D5's form with its fields empty, so Add a link opens the dialog (D5) or the phone's sheet (M6) for a new link.
    addLinkForm: {
      ...addLink.data.addLinkForm,
      link: { ...addLink.data.addLinkForm.link, value: '' },
      name: { ...addLink.data.addLinkForm.name, value: '' },
    },
    // M6's shorter words for the phone's sheet, its fields empty too.
    addLinkSheet: {
      ...addLinkPhone.data.addLinkForm,
      link: { ...addLinkPhone.data.addLinkForm.link, value: '' },
      name: { ...addLinkPhone.data.addLinkForm.name, value: '' },
    },
  },
  ui: { ...library.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
