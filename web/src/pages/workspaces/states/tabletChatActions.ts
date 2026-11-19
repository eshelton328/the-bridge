// Figma Workbench T2b (402:5574), "T2b · Chat actions menu": bridge themes on
// the iPad mini, which keeps working, with the ⋯ beside its state open and the
// chat actions under it as a menu, the same list as the desktop's (D2b): New
// chat, Fork, Side chat (/btw), Subtask, then Subagents · 2, Folders…, Move to
// workspace and Rename chat. The pointer rests on Move to workspace. The chat
// fills the screen as on the phone, with no tab bar: the header with the back
// button, the title over omni-brain, Working and the ⋯, then Opus 5.5 and the
// context used; the owner's message, the read line and Claude's reply with Copy,
// and the empty composer with Opus 5.5 and Stop. Starts from T2
// (tabletSideChat), without the side chat sheet; at a desktop width it draws
// M1's sidebar with bridge themes alone and its chat actions menu open.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'
import { tabletSideChat } from './tabletSideChat.ts'

// T2's chat with Opus 5.5 in the composer: Figma's tablet composer has the model chip (402:5798), which the phone's
// has not.
const bridgeThemes: WorkbenchPane[] = tabletSideChat.data.panes.map((p) =>
  p.type === 'chat' ? { ...p, composer: { ...p.composer, model: 'Opus 5.5' } } : p,
)

export const tabletChatActions = {
  title: 'The chat actions on the tablet, in a menu under the chat’s ⋯',
  frames: [{ id: 'T2b', node: '402:5574', viewport: 'tablet' }],
  data: {
    ...tabletSideChat.data,
    panes: bridgeThemes,
    chatMenu: chatActions.data.chatMenu,
    layers: {
      ...tabletSideChat.data.layers,
      phoneBack: '402:5637',
      chatHead: '402:5635',
      chatActions: '402:5648',
      chatMenu: '402:5721',
      entries: ['402:5664', undefined, '402:5669'],
      composer: '402:5783',
      sideHeader: undefined,
      sideNote: undefined,
      sideEntries: undefined,
      sideComposer: undefined,
    },
  },
  ui: {
    ...tabletSideChat.ui,
    sideChatOpen: false,
    menuFor: 'bridge-themes',
    menuHighlight: 'move',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
