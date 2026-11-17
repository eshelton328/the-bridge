// Every Figma state of the Workspaces page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is
// the page's default state.
import { sideChat } from './sideChat.ts'
import { workbench } from './workbench.ts'

export const workspacesStates = {
  workbench,
  sideChat,
}
