// Figma Workbench D18 (417:1118), "D18 · Subtask running": what Start subtask
// (D17) opens. The subtask's chat, layout notes, is listed under bridge
// themes as a nested row after theme tokens, Running. bridge themes stays
// selected and shown alone, Working, and a line under its reply says where
// the subtask started; Subagents in the ⋯ menu counts 3. The pointer rests
// on omni's header. Starts from D2b (chatActions), without the side chat and
// the menu.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SidebarChat, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

const subtask: SidebarChat = {
  id: 'layout-notes',
  kind: 'claude',
  title: 'layout notes',
  model: 'Opus 5.5',
  context: 4,
  status: { label: 'Running', tone: 'running' },
  level: 1,
}

// The new subtask follows the chat's other nested rows.
const workspaces = chatActions.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'theme-tokens')
  return at === -1 ? w : { ...w, chats: [...chats.slice(0, at + 1), subtask, ...chats.slice(at + 1)] }
})

// bridge themes keeps working; the line marks where the subtask started.
const panes: WorkbenchPane[] = chatActions.data.panes.map((p) =>
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
      }
    : p,
)

const chatMenu = chatActions.data.chatMenu.map((a) => (a.value === 'subagents' ? { ...a, label: 'Subagents · 3' } : a))

export const subtaskRunning = {
  title: 'Subtask running',
  frames: [{ id: 'D18', node: '417:1118', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    workspaces,
    panes,
    chatMenu,
    layers: {
      sidebar: '417:1160',
      toggle: '417:1163',
      newWorkspace: '417:1168',
      headers: {
        'omni-brain': '417:1172',
        'the-bridge': '417:1246',
        omni: '417:1289',
        'skill-evals': '417:1324',
      },
      rows: {
        'bridge-themes': '417:1190',
        'theme-tokens': '417:1204',
        'layout-notes': '417:1418',
        'drift-check': '417:1219',
        'brain-git': '417:1235',
        'hono-server': '417:1264',
        'dev-server': '417:1278',
        'release-notes': '417:1308',
      },
      mainChat: '417:1341',
      chatHead: '417:1342',
      chatActions: '417:1353',
      composer: '417:1388',
      entries: ['417:1370', undefined, '417:1375'],
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'bridge-themes',
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
