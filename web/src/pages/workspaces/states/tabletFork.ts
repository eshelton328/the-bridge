// Figma Workbench T8 (420:413), "T8 · Fork a chat": the chat actions' Fork on
// the iPad mini, D15's Fork form in a dialog centred over bridge themes, which
// keeps working under the scrim. The form is titled "Fork bridge themes" with
// ×: the copy's name, "bridge themes · fork", with "you can rename it later"
// inside the field, where it starts, Whole chat (chosen) or Up to a message…,
// the line on what the fork copies, then Cancel and Fork. Fork starts nothing;
// the copy waits for the owner's next message. Under it the chat fills the screen
// as on the phone, with no tab bar: the header with the back button, the title
// over omni-brain, Working and the ⋯, then Opus 5.5 and the context used;
// the owner's message, the read line and Claude's reply with Copy, and the empty
// composer with Opus 5.5 and Stop. Starts from T2b (tabletChatActions),
// without the menu, with D15's Fork form (forkDialog) open; at a desktop width
// it draws M1's sidebar with bridge themes alone and D15's dialog over it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { forkDialog } from './forkDialog.ts'
import { tabletChatActions } from './tabletChatActions.ts'

export const tabletFork = {
  title: 'Fork a chat on the tablet, in a dialog over the chat',
  frames: [{ id: 'T8', node: '420:413', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    fork: forkDialog.data.fork,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '420:476',
      chatHead: '420:474',
      chatActions: '420:487',
      entries: ['420:503', undefined, '420:508'],
      chatMenu: undefined,
      composer: '420:520',
      forkDialog: {
        dialog: '420:544',
        name: '420:551',
        startFrom: '420:558',
        choices: ['420:562', '420:566'],
        note: '420:632',
        cancel: '420:625',
        submit: '420:627',
      },
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    chatDialog: 'fork',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
