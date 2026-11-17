// Every Figma state of the Artifacts page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { library } from './library.ts'

export const artifactsStates = {
  library,
}
