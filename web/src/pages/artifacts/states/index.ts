// Every Figma state of the Artifacts page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is the
// state the app shows without `?state=`.
import { artifactOpen } from './artifactOpen.ts'
import { filterOpen } from './filterOpen.ts'
import { library } from './library.ts'
import { searchList } from './searchList.ts'

export const artifactsStates = {
  library,
  artifactOpen,
  filterOpen,
  searchList,
}
