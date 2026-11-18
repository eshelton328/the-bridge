// Figma Workbench M4 (105:2853), "M4 · Chat actions": the ⋯ of bridge themes'
// header on the phone opens a sheet over the chat, titled bridge themes, with
// every action on the chat: Fork, Side chat, Subtask, Subagents · 2,
// Folders · 2, Move to workspace (open, with the-bridge checked over omni,
// skill-evals and New workspace…), Rename and Close chat. At a desktop width
// the state draws M1's sidebar with bridge themes alone and its chat actions
// menu open on Move to workspace. Starts from M3 (phoneChat), without the
// skill list and the "/" typed.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChat } from './phoneChat.ts'

// M3's chat with an empty composer: Figma's sheet covers it, and nothing is typed.
const bridgeThemes: WorkbenchPane[] = phoneChat.data.panes.map((p) =>
  p.type === 'chat'
    ? {
        ...p,
        composer: { placeholder: p.composer.placeholder, text: '', attachments: [], running: p.composer.running },
      }
    : p,
)

export const phoneChatActions = {
  title: 'The actions on a chat, in a sheet on the phone',
  frames: [{ id: 'M4', node: '105:2853', viewport: 'phone' }],
  data: {
    ...phoneChat.data,
    panes: bridgeThemes,
    phone: {
      ...phoneChat.data.phone,
      chatMenu: [
        { value: 'fork', label: 'Fork' },
        { value: 'sideChat', label: 'Side chat' },
        { value: 'subtask', label: 'Subtask' },
        { value: 'subagents', label: 'Subagents · 2' },
        { value: 'folders', label: 'Folders · 2' },
        { value: 'move', label: 'Move to workspace' },
        { value: 'rename', label: 'Rename' },
        { value: 'close', label: 'Close chat' },
      ],
    },
    layers: {
      ...phoneChat.data.layers,
      phoneBack: '105:2880',
      chatHead: '105:2878',
      chatActions: '105:2891',
      entries: ['105:2907', undefined, '105:2912'],
      skills: undefined,
      composer: undefined,
      sheetIcons: {
        fork: '105:2938',
        sideChat: '105:2949',
        subtask: '105:2956',
        subagents: '105:2963',
        folders: '136:68',
        move: '105:2975',
        'the-bridge': '105:2988',
        omni: '105:2998',
        'skill-evals': '105:3006',
        new: '105:3014',
        rename: '105:3020',
        close: '105:3026',
      },
    },
  },
  ui: {
    ...phoneChat.ui,
    skillsFor: null,
    skill: null,
    menuFor: 'bridge-themes',
    moveOpen: true,
    moveTarget: 'the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
