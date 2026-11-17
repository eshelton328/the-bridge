// Every Figma state of the Artifacts page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { addLink } from './addLink.ts'
import { artifactOpen } from './artifactOpen.ts'
import { changeApplied } from './changeApplied.ts'
import { changeProposed } from './changeProposed.ts'
import { discussOpen } from './discussOpen.ts'
import { filterOpen } from './filterOpen.ts'
import { library } from './library.ts'
import { searchList } from './searchList.ts'
import { sortOpen } from './sortOpen.ts'

export const artifactsStates = {
  addLink,
  artifactOpen,
  changeApplied,
  changeProposed,
  discussOpen,
  filterOpen,
  library,
  searchList,
  sortOpen,
}
