// Every Figma state of the Workspaces page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is
// the page's default state.
import { chatActions } from './chatActions.ts'
import { chatInWorkbench } from './chatInWorkbench.ts'
import { dragIntoPane } from './dragIntoPane.ts'
import { folders } from './folders.ts'
import { sideChat } from './sideChat.ts'
import { sideChatInPane } from './sideChatInPane.ts'
import { subagents } from './subagents.ts'
import { workbench } from './workbench.ts'
import { dragOverPane } from './dragOverPane.ts'
import { twoPanes } from './twoPanes.ts'
import { dragBelowPane } from './dragBelowPane.ts'
import { threePanes } from './threePanes.ts'

export const workspacesStates = {
  workbench,
  sideChat,
  chatActions,
  subagents,
  folders,
  sideChatInPane,
  dragIntoPane,
  chatInWorkbench,
  dragOverPane,
  twoPanes,
  dragBelowPane,
  threePanes,
}
