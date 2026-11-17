// Figma Toolkit M4 "M4 · More drawer": on the phone, the tab bar's More
// opens the drawer over the tab bar. Toolkit has moved out of Later and
// comes after Artifacts; Brain and Workflows stay under Later. Copy word
// for word from references/toolkit/M04/frame.json: Artifacts 24 and
// Toolkit 27. Figma draws the drawer over the Artifacts list; this page
// can only draw its own list under it, so the data behind the drawer is
// M1's (toolkitListTablet), and Toolkit, the page on screen, is the
// selected item.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

export const moreDrawer = {
  title: 'the More drawer over the tab bar, with Toolkit after Artifacts',
  frames: [{ id: 'M4', node: '424:6627', viewport: 'phone' }],
  data: { ...toolkitListTablet.data, artifactsCount: 24 },
  ui: { ...toolkitListTablet.ui, moreOpen: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
