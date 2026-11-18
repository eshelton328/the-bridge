// Figma Workbench M21 (422:612), "M21 · Subtask running": what Start subtask
// (M20) opens on the phone. bridge themes fills the screen as M17's chat does,
// still Working with Stop, and a line under Claude's reply marks where the
// subtask layout notes started; the composer has requirements.md attached,
// the placeholder and the focus. Subagents in the chat actions sheet counts 3,
// and Back returns to the list, where layout notes is under bridge themes,
// Running, as in D18. At a desktop width the state draws M1's sidebar with
// bridge themes alone.
// Starts from M17 (phoneChatFull), with M18's empty message box (phoneFork),
// M4's chat actions (phoneChatActions), D18's subtask row (subtaskRunning) and
// M21's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SidebarChat, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { phoneChatFull } from './phoneChatFull.ts'
import { phoneFork } from './phoneFork.ts'
import { subtaskRunning } from './subtaskRunning.ts'

const subtask: SidebarChat | undefined = subtaskRunning.data.workspaces
  .flatMap((w) => w.chats)
  .find((c) => c.id === 'layout-notes')

// D18's subtask row follows the chat's other nested rows in the phone's list.
const workspaces = phoneChatFull.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'theme-tokens')
  return at === -1 || subtask === undefined
    ? w
    : { ...w, chats: [...chats.slice(0, at + 1), subtask, ...chats.slice(at + 1)] }
})

// M18's pane (nothing typed, still running) and the line where the subtask started (422:712), a tool line with no
// layer, as in M19.
const panes: WorkbenchPane[] = phoneFork.data.panes.map((p) =>
  p.type === 'chat' && p.id === 'bridge-themes'
    ? {
        ...p,
        entries: [
          ...p.entries,
          { type: 'event', label: 'Subtask started', text: 'Subtask layout notes started · returns here' },
        ],
      }
    : p,
)

const chatMenu = phoneChatActions.data.phone.chatMenu.map((a) =>
  a.value === 'subagents' ? { ...a, label: 'Subagents · 3' } : a,
)

export const phoneSubtaskRunning = {
  title: 'A subtask running from a chat on the phone',
  frames: [{ id: 'M21', node: '422:612', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    workspaces,
    panes,
    phone: { ...phoneChatFull.data.phone, chatMenu },
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:639',
      chatHead: '422:637',
      chatActions: '422:650',
      entries: ['422:666', undefined, '422:671'],
      composer: '422:684',
    },
  },
  ui: { ...phoneChatFull.ui, focusedPane: 'bridge-themes' },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
