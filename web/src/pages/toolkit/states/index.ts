// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is
// the one the route shows.
import { moreDrawer } from './moreDrawer.ts'
import { ruleOpen } from './ruleOpen.ts'
import { skillOpen } from './skillOpen.ts'
import { toolkitList } from './toolkitList.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'
import { toolkitMap } from './toolkitMap.ts'
import { toolkitMapTablet } from './toolkitMapTablet.ts'

export const toolkitStates = {
  toolkitList,
  toolkitListTablet,
  moreDrawer,
  toolkitMap,
  toolkitMapTablet,
  skillOpen,
  ruleOpen,
}
