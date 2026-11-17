// Every Figma state of the Workspaces page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { workbench } from './workbench.ts'

export const workspacesStates = {
  workbench,
}
