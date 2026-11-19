// Figma Workbench M5 (105:3034), "M5 · Side chat": the side chat on the
// phone, a sheet over bridge themes, which keeps working under the scrim.
// The sheet has the bubble, Side chat and /btw with ×, the note "Nothing
// here enters bridge themes. Close it and the main chat carries on.", the owner's
// question and Claude's answer with Copy, and the composer, which has the
// focus. At a desktop width the state draws M1's sidebar with bridge themes
// alone and the side chat beside it. Starts from M4 (phoneChatActions),
// without the actions sheet, with D2's side chat and M5's note.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { sideChat } from './sideChat.ts'

export const phoneSideChat = {
  title: 'The side chat on the phone, in a sheet over the main chat',
  frames: [{ id: 'M5', node: '105:3034', viewport: 'phone' }],
  data: {
    ...phoneChatActions.data,
    sideChat: {
      ...sideChat.data.sideChat,
      note: 'Nothing here enters bridge themes. Close it and the main chat carries on.',
    },
    layers: {
      ...phoneChatActions.data.layers,
      phoneBack: '105:3061',
      chatHead: '105:3059',
      chatActions: '105:3072',
      entries: ['105:3088', undefined, '105:3093'],
      sheetIcons: undefined,
      sideChat: undefined,
      sideHeader: '105:3109',
      sideNote: '105:3120',
      sideEntries: ['105:3121', '105:3123'],
      sideComposer: '105:3136',
    },
  },
  ui: {
    ...phoneChatActions.ui,
    menuFor: null,
    moveOpen: false,
    moveTarget: null,
    sideChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
