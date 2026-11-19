// Figma Workbench M22 (422:719), "M22 · Moved": what picking a workspace in the
// chat actions sheet (M4) leaves on the phone. The sheet is closed, bridge
// themes fills the screen as M17's chat does, still Working with Stop, and its
// header names the-bridge; a toast over the composer confirms the move, with
// Undo. The composer has requirements.md attached, the placeholder and the
// focus. Back returns to the list, where bridge themes and theme tokens head
// the-bridge, as in D20. At a desktop width the state draws M1's sidebar with
// bridge themes alone and D20's toast over its composer.
// Starts from M17 (phoneChatFull), with M18's empty message box (phoneFork),
// M4's chat actions (phoneChatActions), D20's move (movedChat) and M22's
// layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { movedChat, moveLastChats } from './movedChat.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { phoneChatFull } from './phoneChatFull.ts'
import { phoneFork } from './phoneFork.ts'

export const phoneMovedChat = {
  title: 'Moved to another workspace on the phone',
  frames: [{ id: 'M22', node: '422:719', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    // D20's move of M1's workspaces (phoneChatFull's are D2b's, as D20's): the chat and the subtask chat listed
    // under it head the-bridge's list, with D20's counts.
    workspaces: movedChat.data.workspaces,
    current: movedChat.data.current,
    panes: phoneFork.data.panes,
    lastChats: moveLastChats(phoneChatFull.data.lastChats, phoneFork.data.panes),
    phone: { ...phoneChatFull.data.phone, chatMenu: phoneChatActions.data.phone.chatMenu },
    toast: { text: 'Moved to the-bridge', action: 'Undo' },
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:746',
      chatHead: '422:744',
      chatActions: '422:757',
      entries: ['422:773', undefined, '422:778'],
      composer: '422:791',
      toast: 'toast',
    },
  },
  ui: { ...phoneChatFull.ui, focusedPane: 'bridge-themes', toastOpen: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
