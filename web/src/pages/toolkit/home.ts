// The Toolkit page as the app opens it, with no ?state= (lib/dataSource.ts):
// the list of every item with nothing open, laid out by the window's width
// (ToolkitScreen's ViewportFrame): D1's cards beside the rail on a desktop,
// T1's rows on a tablet and M1's on a phone, each over the tab bar. Its data
// is toolkitListTablet's (T1 and M1: D1's list with the Rules group), so each
// layout has the groups its list draws. Its ui is D1's list view with no
// item, map selection, sheet or More drawer open. It is not a Figma state:
// it lives outside states/, so it has no frame, story, board or fidelity
// check (app/ToolkitHome.test.tsx).
import type { ScreenState } from '../../lib/screenState.ts'
import { toolkitList } from './states/toolkitList.ts'
import { toolkitListTablet } from './states/toolkitListTablet.ts'
import type { ToolkitData, ToolkitUi } from './types.ts'

export const toolkitHome = {
  title: 'the Toolkit as the app opens',
  frames: [],
  data: toolkitListTablet.data,
  ui: { ...toolkitList.ui, view: 'list', open: null, mapSelected: null, moreOpen: false },
} satisfies ScreenState<ToolkitData, ToolkitUi>
