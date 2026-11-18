// Figma Workbench M9 (146:42), "M9 · Long-press a chat": Erik holds drift
// check in the phone's list. The row lifts over the scrim with a cyan border,
// and a sheet titled drift check opens with the same actions as the row's ⋯,
// Rename first and highlighted: Rename, Fork, Side chat, Subtask,
// Subagents · 2, Folders · 2, Move to workspace (closed) and Close chat. The
// list under the scrim is M1's, bridge themes still selected. At a desktop
// width the state draws M1's sidebar with bridge themes alone. Starts from M1
// (phoneHome).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneHome } from './phoneHome.ts'

export const phoneHoldChat = {
  title: 'A chat held in the phone list, with its actions in a sheet',
  frames: [{ id: 'M9', node: '146:42', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    phone: {
      ...phoneHome.data.phone,
      rowMenu: [
        { value: 'rename', label: 'Rename' },
        { value: 'fork', label: 'Fork' },
        { value: 'sideChat', label: 'Side chat' },
        { value: 'subtask', label: 'Subtask' },
        { value: 'subagents', label: 'Subagents · 2' },
        { value: 'folders', label: 'Folders · 2' },
        { value: 'move', label: 'Move to workspace' },
        { value: 'close', label: 'Close chat' },
      ],
    },
    layers: {
      ...phoneHome.data.layers,
      phoneList: '146:67',
      phoneHeader: '146:68',
      phoneEdit: '146:73',
      phoneAdd: '146:75',
      headers: {
        'omni-brain': '146:79',
        'the-bridge': '146:154',
        omni: '146:200',
        'skill-evals': '146:231',
      },
      rows: {
        'bridge-themes': '146:90',
        'theme-tokens': '199:28',
        'drift-check': '146:117',
        'brain-git': '146:138',
        'hono-server': '146:165',
        'dev-server': '146:184',
        'release-notes': '146:210',
      },
      rowMenus: {
        'bridge-themes': '146:104',
        'theme-tokens': '199:42',
        'drift-check': '146:133',
        'brain-git': '146:149',
        'hono-server': '146:179',
        'dev-server': '146:195',
        'release-notes': '146:226',
      },
      liftedRow: '146:252',
      liftedMenu: '146:268',
      sheetIcons: {
        rename: '146:375',
        fork: '146:286',
        sideChat: '146:297',
        subtask: '146:304',
        subagents: '146:311',
        folders: '146:323',
        move: '146:330',
        close: '146:381',
      },
    },
  },
  ui: {
    ...phoneHome.ui,
    menuFor: 'drift-check',
    menuHighlight: 'rename',
    moveOpen: false,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
