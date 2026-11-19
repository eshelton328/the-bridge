// Figma Workbench T11 (420:999), "T11 · Subtask running": what Start subtask
// (T10) opens on the iPad mini. bridge themes fills the screen as T6's chat
// does, with no tab bar, still Working with Stop: the header with the back
// button, the title over omni-brain, Working and the ⋯, then Opus 5.5 and the
// context used; the owner's message, the read line and Claude's reply with Copy, a
// line under it that marks where the subtask layout notes started, and the
// empty composer with Opus 5.5, Stop and the focus. Subagents in the ⋯ menu
// counts 3, and Back returns to the list, where layout notes is under bridge
// themes, Running, as in D18. At a desktop width the state draws M1's sidebar
// with bridge themes alone.
// Starts from T6 (tabletOneChat), with M19's empty composer, D18's subtask row,
// line and chat actions (subtaskRunning) and T11's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { subtaskRunning } from './subtaskRunning.ts'
import { tabletOneChat } from './tabletOneChat.ts'

const subtask = subtaskRunning.data.workspaces.flatMap((w) => w.chats).find((c) => c.id === 'layout-notes')

// D18's subtask row follows the chat's other nested rows in the tablet's list.
const workspaces = tabletOneChat.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'theme-tokens')
  return at === -1 || subtask === undefined
    ? w
    : { ...w, chats: [...chats.slice(0, at + 1), subtask, ...chats.slice(at + 1)] }
})

// T6's pane, still Working with Stop, with nothing typed or attached and D18's line where the subtask started
// (420:1129).
const panes: WorkbenchPane[] = tabletOneChat.data.panes.map((p) =>
  p.type === 'chat' && p.id === 'bridge-themes'
    ? {
        ...p,
        entries: [
          ...p.entries,
          {
            type: 'event',
            label: 'Subtask started',
            text: 'Subtask layout notes started · returns its result here',
          },
        ],
        composer: { ...p.composer, text: '', attachments: [] },
      }
    : p,
)

export const tabletSubtaskRunning = {
  title: 'A subtask running from a chat on the tablet',
  frames: [{ id: 'T11', node: '420:999', viewport: 'tablet' }],
  data: {
    ...tabletOneChat.data,
    workspaces,
    panes,
    chatMenu: subtaskRunning.data.chatMenu,
    layers: {
      ...tabletOneChat.data.layers,
      phoneBack: '420:1062',
      chatHead: '420:1060',
      chatActions: '420:1073',
      entries: ['420:1089', undefined, '420:1094', '420:1129'],
      composer: '420:1106',
    },
  },
  ui: { ...tabletOneChat.ui, focusedPane: 'bridge-themes' },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
