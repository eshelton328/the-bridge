// Figma Workbench M18 (422:116), "M18 · Fork a chat": the chat actions' Fork
// opens a sheet over bridge themes on the phone, titled "Fork bridge themes"
// with ×: the copy's name, "bridge themes · fork", where it starts, Whole chat
// (chosen) or Up to a message…, the line on what it copies, and Fork across
// the sheet. Fork starts nothing. Under the scrim the chat is M17's, with the
// message box empty and out of focus. At a desktop width the state draws M1's
// sidebar with bridge themes alone and D15's Fork dialog over it.
// Starts from M17 (phoneChatFull), with D15's Fork form (forkDialog), M4's chat
// actions (phoneChatActions) and M18's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { forkDialog } from './forkDialog.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { phoneChatFull } from './phoneChatFull.ts'

// M17's pane with nothing typed: Figma shows the placeholder (422:197).
const panes: WorkbenchPane[] = phoneChatFull.data.panes.map((p) =>
  p.type === 'chat' ? { ...p, composer: { ...p.composer, text: '' } } : p,
)

export const phoneFork = {
  title: 'Fork a chat on the phone',
  frames: [{ id: 'M18', node: '422:116', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    panes,
    phone: { ...phoneChatFull.data.phone, chatMenu: phoneChatActions.data.phone.chatMenu },
    fork: {
      ...forkDialog.data.fork,
      name: { value: '{chat} · fork' },
      note: 'Copies the messages and the context. The original keeps running.',
    },
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:143',
      chatHead: '422:141',
      chatActions: '422:154',
      entries: ['422:170', undefined, '422:175'],
      composer: '422:188',
      phoneFork: {
        name: '422:224',
        startFrom: '422:231',
        choices: ['422:235', '422:239'],
        note: '422:305',
        submit: '422:300',
      },
    },
  },
  ui: { ...phoneChatFull.ui, messageFocus: false, chatDialog: 'fork' },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
