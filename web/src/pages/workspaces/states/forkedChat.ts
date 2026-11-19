// Figma Workbench D16 (417:397), "D16 · Forked chat": what Fork (D15) opens.
// The fork, bridge themes · fork, is listed under its original with the
// branch mark and shows alone beside the sidebar. It is Idle, so its
// composer has no Stop, and a line under the copied messages says where it
// was forked. The original, bridge themes, keeps working. The pointer rests
// on omni's header. Starts from D2b (chatActions), without the side chat and
// the menu.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SidebarChat, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

const fork: SidebarChat = {
  id: 'bridge-themes-fork',
  kind: 'claude',
  title: 'bridge themes · fork',
  model: 'Opus 5.5',
  context: 42,
  status: { label: 'Idle', tone: 'idle' },
  level: 1,
  mark: { kind: 'fork', label: 'Fork of bridge themes' },
}

// The fork lists the chats of omni-brain after its original.
const workspaces = chatActions.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'bridge-themes')
  return at === -1 ? w : { ...w, chats: [...chats.slice(0, at + 1), fork, ...chats.slice(at + 1)] }
})

// The fork copies the original's messages and context; it waits for the owner, so its composer has no Stop.
const panes: WorkbenchPane[] = chatActions.data.panes.flatMap((p) =>
  p.type === 'chat' && p.id === 'bridge-themes'
    ? [
        {
          ...p,
          id: fork.id,
          head: { ...p.head, title: fork.title, status: fork.status, origin: 'forked from bridge themes' },
          entries: [
            ...p.entries,
            {
              type: 'event',
              label: 'Forked',
              text: 'Forked from bridge themes here · the messages above are a copy',
            },
          ],
          composer: { ...p.composer, running: false },
        },
        p,
      ]
    : [p],
)

export const forkedChat = {
  title: 'Forked chat',
  frames: [{ id: 'D16', node: '417:397', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    workspaces,
    panes,
    layers: {
      sidebar: '417:439',
      toggle: '417:442',
      newWorkspace: '417:447',
      headers: {
        'omni-brain': '417:451',
        'the-bridge': '417:525',
        omni: '417:568',
        'skill-evals': '417:603',
      },
      rows: {
        'bridge-themes': '417:469',
        'bridge-themes-fork': '417:697',
        'theme-tokens': '417:483',
        'drift-check': '417:498',
        'brain-git': '417:514',
        'hono-server': '417:543',
        'dev-server': '417:557',
        'release-notes': '417:587',
      },
      mainChat: '417:620',
      chatHead: '417:621',
      chatActions: '417:632',
      composer: '417:667',
      entries: ['417:649', undefined, '417:654'],
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'bridge-themes-fork',
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
