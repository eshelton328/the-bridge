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
import { fourPanes } from './fourPanes.ts'
import { emptiedPane } from './emptiedPane.ts'
import { resizedPanes } from './resizedPanes.ts'
import { forkDialog } from './forkDialog.ts'
import { forkedChat } from './forkedChat.ts'
import { subtaskDialog } from './subtaskDialog.ts'
import { subtaskRunning } from './subtaskRunning.ts'
import { moveToWorkspace } from './moveToWorkspace.ts'
import { movedChat } from './movedChat.ts'
import { renameChat } from './renameChat.ts'
import { phoneHome } from './phoneHome.ts'
import { phoneEdit } from './phoneEdit.ts'
import { phoneChat } from './phoneChat.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { phoneSideChat } from './phoneSideChat.ts'
import { phoneSubagents } from './phoneSubagents.ts'
import { phoneNewChat } from './phoneNewChat.ts'
import { phoneFolders } from './phoneFolders.ts'
import { phoneHoldChat } from './phoneHoldChat.ts'
import { phoneKeyboard } from './phoneKeyboard.ts'
import { phoneNewChatKeyboard } from './phoneNewChatKeyboard.ts'
import { phoneSubagentTranscript } from './phoneSubagentTranscript.ts'
import { phoneCloseWorkspace } from './phoneCloseWorkspace.ts'
import { phoneWorkspaceActions } from './phoneWorkspaceActions.ts'
import { phoneAddMenu } from './phoneAddMenu.ts'
import { phoneTapChat } from './phoneTapChat.ts'
import { phoneChatFull } from './phoneChatFull.ts'
import { phoneFork } from './phoneFork.ts'
import { phoneForkedChat } from './phoneForkedChat.ts'
import { phoneSubtask } from './phoneSubtask.ts'
import { phoneSubtaskRunning } from './phoneSubtaskRunning.ts'
import { phoneMovedChat } from './phoneMovedChat.ts'
import { phoneRenameChat } from './phoneRenameChat.ts'
import { tabletEdit } from './tabletEdit.ts'
import { tabletSideChat } from './tabletSideChat.ts'
import { tabletChatActions } from './tabletChatActions.ts'
import { tabletSubagents } from './tabletSubagents.ts'
import { tabletComposing } from './tabletComposing.ts'
import { tabletFolders } from './tabletFolders.ts'
import { tabletOneChat } from './tabletOneChat.ts'
import { tabletNewChat } from './tabletNewChat.ts'

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
  fourPanes,
  emptiedPane,
  resizedPanes,
  forkDialog,
  forkedChat,
  subtaskDialog,
  subtaskRunning,
  moveToWorkspace,
  movedChat,
  renameChat,
  phoneHome,
  phoneEdit,
  phoneChat,
  phoneChatActions,
  phoneSideChat,
  phoneSubagents,
  phoneNewChat,
  phoneFolders,
  phoneHoldChat,
  phoneKeyboard,
  phoneNewChatKeyboard,
  phoneSubagentTranscript,
  phoneCloseWorkspace,
  phoneWorkspaceActions,
  phoneAddMenu,
  phoneTapChat,
  phoneChatFull,
  phoneFork,
  phoneForkedChat,
  phoneSubtask,
  phoneSubtaskRunning,
  phoneMovedChat,
  phoneRenameChat,
  tabletEdit,
  tabletSideChat,
  tabletChatActions,
  tabletSubagents,
  tabletComposing,
  tabletFolders,
  tabletOneChat,
  tabletNewChat,
}
