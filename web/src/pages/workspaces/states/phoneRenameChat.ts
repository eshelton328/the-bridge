// Figma Workbench M23 (422:825), "M23 · Rename chat": what Rename in the chat
// actions sheet (M4) leaves on the phone. The sheet is closed, bridge themes
// fills the screen as M17's chat does, still Working with Stop, and the name
// in its header is a field with the focus, the caret after the name and × at
// its end, as in D21. Tapping outside saves the name; × undoes the change and
// closes the field, as in M2. The composer has requirements.md attached and
// the placeholder. At a desktop width the state draws M1's sidebar with bridge
// themes alone and D21's field in its header.
// Starts from M17 (phoneChatFull), with M18's empty message box (phoneFork),
// M4's chat actions (phoneChatActions), D21's rename (renameChat) and M23's
// layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { phoneChatFull } from './phoneChatFull.ts'
import { phoneFork } from './phoneFork.ts'

export const phoneRenameChat = {
  title: 'Rename a chat on the phone',
  frames: [{ id: 'M23', node: '422:825', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    panes: phoneFork.data.panes,
    phone: { ...phoneChatFull.data.phone, chatMenu: phoneChatActions.data.phone.chatMenu },
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:852',
      chatHead: '422:850',
      chatActions: '422:863',
      entries: ['422:879', undefined, '422:884'],
      composer: '422:897',
      renameField: 'rename field · chat',
    },
  },
  // The field has the focus, so the message box has none.
  ui: { ...phoneChatFull.ui, focusedPane: 'bridge-themes', messageFocus: false, renaming: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
