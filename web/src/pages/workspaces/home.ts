// The Workspaces page as the app opens it, with no ?state= (lib/dataSource.ts):
// the base data of M1 (phoneHome, which starts from D2b) with the phone's
// labels and `tabletList`, so the screen lays out by the window's width
// (D2b's sidebar on a desktop, the list with the tab bar on a tablet or a
// phone), and every menu, list, popover and dialog closed. The phone's chat
// names its back button "Back to Workspaces", as M3 (phoneChat) does. It is not a
// Figma state: it lives outside states/, so it has no frame, story, board
// or fidelity check.
import type { ScreenState } from '../../lib/screenState.ts'
import { phoneChat } from './states/phoneChat.ts'
import { phoneHome } from './states/phoneHome.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'

export const workspacesHome = {
  title: 'Workspaces as the app opens',
  frames: [],
  data: { ...phoneHome.data, phone: { ...phoneHome.data.phone, back: phoneChat.data.phone.back }, tabletList: true },
  ui: {
    ...phoneHome.ui,
    menuFor: null,
    moveOpen: false,
    moveTarget: null,
    menuHighlight: null,
    skillsFor: null,
    skill: null,
    hovered: null,
    drag: null,
    paneDrag: null,
    sideChatOpen: false,
    subagentsOpen: false,
    newChatOpen: false,
    chatDialog: null,
    foldersOpen: false,
    folderPickerOpen: false,
    toastOpen: false,
    renaming: false,
    editing: false,
    phoneView: 'list',
    keyboardOpen: false,
    workspaceMenuFor: null,
    addMenuOpen: false,
    closing: null,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
