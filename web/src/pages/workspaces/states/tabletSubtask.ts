// Figma Workbench T10 (420:776), "T10 · Start a subtask": the chat actions'
// Subtask on the iPad mini, D17's Subtask form in a dialog centred over
// bridge themes, which keeps working under the scrim. The form is titled
// "Start a subtask" with ×: the model that runs the subagent, Sonnet 5.5 ·
// high effort, and what it should do, with the task typed and the box
// focused, the line on what the subtask gets and where its result goes, then
// Cancel and Start subtask. Start subtask starts nothing. Under it the chat
// fills the screen as on the phone, with no tab bar: the header with the back
// button, the title over omni-brain, Working and the ⋯, then Opus 5.5 and the
// context used; the owner's message, the read line and Claude's reply with Copy,
// and the empty composer with Opus 5.5 and Stop. Starts from T2b
// (tabletChatActions), without the menu, with D17's Subtask form
// (subtaskDialog) open; at a desktop width it draws M1's sidebar with bridge
// themes alone and D17's dialog over it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { subtaskDialog } from './subtaskDialog.ts'
import { tabletChatActions } from './tabletChatActions.ts'

export const tabletSubtask = {
  title: 'Start a subtask on the tablet, in a dialog over the chat',
  frames: [{ id: 'T10', node: '420:776', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    subtask: subtaskDialog.data.subtask,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '420:839',
      chatHead: '420:837',
      chatActions: '420:850',
      entries: ['420:866', undefined, '420:871'],
      chatMenu: undefined,
      composer: '420:883',
      subtaskDialog: {
        dialog: '420:907',
        model: '420:968',
        modelBox: '420:971',
        task: '420:976',
        taskBox: '420:979',
        note: '420:995',
        cancel: '420:988',
        submit: '420:990',
      },
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    chatDialog: 'subtask',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
