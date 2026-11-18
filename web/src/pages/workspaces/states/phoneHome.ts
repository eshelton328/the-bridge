// Figma Workbench M1 (105:2302), "M1 · Workspaces": the phone's home. Every
// workspace and its chats, each chat with what it runs in, its model, its
// context use and its state, and its ⋯; theme tokens is nested under bridge
// themes, which is drawn selected, and skill-evals is closed. The large title
// has Edit and +, and the tab bar shows Workspaces selected and Inbox's count.
// At a desktop width the state draws D2b's sidebar with bridge themes alone.
// Starts from D2b (chatActions), without the side chat, the drag, the hovered
// header and the menu.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const phoneHome = {
  title: 'Workspaces on the phone',
  frames: [{ id: 'M1', node: '105:2302', viewport: 'phone' }],
  data: {
    ...chatActions.data,
    phone: { title: 'Workspaces', edit: 'Edit', add: 'New chat or workspace' },
    layers: {
      phoneList: '105:2327',
      phoneHeader: '105:2328',
      phoneEdit: '105:2333',
      phoneAdd: '105:2335',
      headers: {
        'omni-brain': '105:2339',
        'the-bridge': '105:2394',
        omni: '105:2430',
        'skill-evals': '105:2456',
      },
      rows: {
        'bridge-themes': '105:2350',
        'theme-tokens': '199:5',
        'drift-check': '105:2367',
        'brain-git': '105:2383',
        'hono-server': '105:2405',
        'dev-server': '105:2419',
        'release-notes': '105:2440',
      },
      rowMenus: {
        'bridge-themes': '146:2',
        'theme-tokens': '199:19',
        'drift-check': '146:7',
        'brain-git': '146:12',
        'hono-server': '146:17',
        'dev-server': '146:22',
        'release-notes': '146:27',
      },
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'bridge-themes',
    menuFor: null,
    menuHighlight: null,
    hovered: null,
    drag: null,
    sideChatOpen: false,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
