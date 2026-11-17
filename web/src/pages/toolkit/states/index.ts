// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { toolkitList } from './toolkitList.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'
import { moreDrawer } from './moreDrawer.ts'

export const toolkitStates = {
  toolkitList,
  toolkitListTablet,
  moreDrawer,
}
