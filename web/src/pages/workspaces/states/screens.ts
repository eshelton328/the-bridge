// The Workspaces page's screens (screen review R10): the states that draw
// each screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/WorkspacesScreens.stories.tsx. Every state is in
// exactly one screen (states/screens.test.ts). The split panes and their
// drags are desktop only (R19); the list, its edit mode and the keyboard
// views have no desktop state.
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { workspacesStates } from './index.ts'

export const workspacesScreens = {
  workbench: { title: 'The workbench', desktop: 'workbench' },
  sideChat: { title: 'Side chat', desktop: 'sideChat', tablet: 'tabletSideChat', phone: 'phoneSideChat' },
  chatActions: {
    title: 'Chat actions menu',
    desktop: 'chatActions',
    tablet: 'tabletChatActions',
    phone: 'phoneChatActions',
  },
  newChat: { title: 'New chat form', desktop: 'subagents', tablet: 'tabletNewChat', phone: 'phoneNewChat' },
  folders: { title: 'Chat folders', desktop: 'folders', tablet: 'tabletFolders', phone: 'phoneFolders' },
  sideChatInPane: { title: 'Side chat in a pane', desktop: 'sideChatInPane' },
  dragIntoPane: { title: 'Chat dragged onto the open chat', desktop: 'dragIntoPane' },
  openChat: { title: 'An open chat', desktop: 'chatInWorkbench', tablet: 'tabletOneChat', phone: 'phoneChatFull' },
  dragOverPane: { title: 'Chat dragged over a pane', desktop: 'dragOverPane' },
  twoPanes: { title: 'Two panes', desktop: 'twoPanes' },
  dragBelowPane: { title: 'Chat dragged below a pane', desktop: 'dragBelowPane' },
  threePanes: { title: 'Three panes', desktop: 'threePanes' },
  fourPanes: { title: 'Four panes', desktop: 'fourPanes' },
  emptiedPane: { title: 'An emptied pane', desktop: 'emptiedPane' },
  resizedPanes: { title: 'Resized panes', desktop: 'resizedPanes' },
  fork: { title: 'Fork form', desktop: 'forkDialog', tablet: 'tabletFork', phone: 'phoneFork' },
  forkedChat: { title: 'The forked chat', desktop: 'forkedChat', tablet: 'tabletForkedChat', phone: 'phoneForkedChat' },
  subtask: { title: 'Subtask form', desktop: 'subtaskDialog', tablet: 'tabletSubtask', phone: 'phoneSubtask' },
  subtaskRunning: {
    title: 'A running subtask',
    desktop: 'subtaskRunning',
    tablet: 'tabletSubtaskRunning',
    phone: 'phoneSubtaskRunning',
  },
  moveToWorkspace: { title: 'Move to workspace list', desktop: 'moveToWorkspace', tablet: 'tabletMoveToWorkspace' },
  movedChat: { title: 'Moved chat toast', desktop: 'movedChat', tablet: 'tabletMovedChat', phone: 'phoneMovedChat' },
  renameChat: { title: 'Chat name field', desktop: 'renameChat', tablet: 'tabletRenameChat', phone: 'phoneRenameChat' },
  workspaceList: { title: 'The workspace list', phone: 'phoneHome' },
  editMode: { title: 'Edit mode', tablet: 'tabletEdit', phone: 'phoneEdit' },
  skills: { title: 'Skills after "/"', tablet: 'tabletComposing', phone: 'phoneChat' },
  subagents: { title: 'Subagents', tablet: 'tabletSubagents', phone: 'phoneSubagents' },
  holdChat: { title: 'A held chat', phone: 'phoneHoldChat' },
  keyboard: { title: 'Chat with the keyboard up', phone: 'phoneKeyboard' },
  newChatKeyboard: { title: 'New chat with the keyboard up', phone: 'phoneNewChatKeyboard' },
  subagentTranscript: { title: 'Subagent transcript', phone: 'phoneSubagentTranscript' },
  closeWorkspace: { title: 'Close workspace dialog', phone: 'phoneCloseWorkspace' },
  workspaceActions: { title: 'Workspace actions', phone: 'phoneWorkspaceActions' },
  addMenu: { title: 'Add menu', phone: 'phoneAddMenu' },
  tapChat: { title: 'A tap on a chat', phone: 'phoneTapChat' },
} as const satisfies ScreenMap<keyof typeof workspacesStates>
