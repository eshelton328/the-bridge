// Every Figma state of the Artifacts page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is the
// state the app shows without `?state=`.
import { addLink } from './addLink.ts'
import { artifactOpen } from './artifactOpen.ts'
import { artifactTablet } from './artifactTablet.ts'
import { changeApplied } from './changeApplied.ts'
import { changeProposed } from './changeProposed.ts'
import { discussOpen } from './discussOpen.ts'
import { filterOpen } from './filterOpen.ts'
import { library } from './library.ts'
import { libraryTablet } from './libraryTablet.ts'
import { searchList } from './searchList.ts'
import { sortOpen } from './sortOpen.ts'
import { filterTablet } from './filterTablet.ts'
import { discussTablet } from './discussTablet.ts'
import { changeProposedTablet } from './changeProposedTablet.ts'
import { libraryPhone } from './libraryPhone.ts'
import { artifactPhone } from './artifactPhone.ts'
import { filterPhone } from './filterPhone.ts'
import { sortPhone } from './sortPhone.ts'
import { searchPhone } from './searchPhone.ts'

export const artifactsStates = {
  library,
  artifactOpen,
  filterOpen,
  searchList,
  addLink,
  sortOpen,
  discussOpen,
  changeProposed,
  changeApplied,
  libraryTablet,
  artifactTablet,
  filterTablet,
  discussTablet,
  changeProposedTablet,
  libraryPhone,
  artifactPhone,
  filterPhone,
  sortPhone,
  searchPhone,
}
