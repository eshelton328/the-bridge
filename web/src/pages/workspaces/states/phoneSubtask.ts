// Figma Workbench M20 (422:419), "M20 · Start a subtask": the chat actions'
// Subtask opens a sheet over bridge themes on the phone, titled "Start a
// subtask" with ×: the model, Sonnet 5.5 · high effort, what the subtask
// should do, "Draft layout notes for the three directions." typed with the
// focus, the line on what it gets and where its result goes, and Start
// subtask across the sheet. Start subtask starts nothing. Under the scrim the
// chat is M18's, with the message box empty and out of focus. At a desktop
// width the state draws M1's sidebar with bridge themes alone and D17's
// Subtask dialog over it.
// Starts from M18 (phoneFork): M17 (phoneChatFull) with M18's panes and chat
// actions, without the Fork form, with D17's Subtask form
// (subtaskDialog) and M20's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChatFull } from './phoneChatFull.ts'
import { phoneFork } from './phoneFork.ts'
import { subtaskDialog } from './subtaskDialog.ts'

export const phoneSubtask = {
  title: 'Start a subtask on the phone',
  frames: [{ id: 'M20', node: '422:419', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    panes: phoneFork.data.panes,
    phone: phoneFork.data.phone,
    subtask: {
      ...subtaskDialog.data.subtask,
      task: { value: 'Draft layout notes for the three directions.' },
    },
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:446',
      chatHead: '422:444',
      chatActions: '422:457',
      entries: ['422:473', undefined, '422:478'],
      composer: '422:491',
      phoneSubtask: {
        model: '422:581',
        modelBox: '422:584',
        task: '422:589',
        taskBox: '422:592',
        note: '422:608',
        submit: '422:599',
      },
    },
  },
  ui: { ...phoneFork.ui, chatDialog: 'subtask' },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
