// Figma Workbench D2b (402:5034), "Chat actions menu": the screen of D2
// without the drag, with the ⋯ beside bridge themes' state pressed and its
// menu open: New chat, Fork, Side chat (/btw), Subtask, then Subagents · 2,
// Folders…, Move to workspace and Rename chat. The pointer rests on Move to
// workspace and on omni's header. Starts from D2 (sideChat).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { sideChat } from './sideChat.ts'

export const chatActions = {
  title: 'Chat actions menu',
  frames: [{ id: 'D2b', node: '402:5034', viewport: 'desktop' }],
  data: {
    ...sideChat.data,
    chatMenu: [
      { value: 'newChat', label: 'New chat' },
      { value: 'fork', label: 'Fork' },
      { value: 'sideChat', label: 'Side chat (/btw)' },
      { value: 'subtask', label: 'Subtask' },
      { value: 'subagents', label: 'Subagents · 2' },
      { value: 'folders', label: 'Folders…' },
      { value: 'move', label: 'Move to workspace' },
      { value: 'rename', label: 'Rename chat' },
    ],
    layers: {
      sidebar: '402:5175',
      toggle: '402:5178',
      newWorkspace: '402:5183',
      headers: {
        'omni-brain': '402:5187',
        'the-bridge': '402:5261',
        omni: '402:5304',
        'skill-evals': '402:5339',
      },
      rows: {
        'bridge-themes': '402:5205',
        'theme-tokens': '402:5219',
        'drift-check': '402:5234',
        'brain-git': '402:5250',
        'hono-server': '402:5279',
        'dev-server': '402:5293',
        'release-notes': '402:5323',
      },
      mainChat: '402:5356',
      chatHead: '402:5357',
      chatActions: '402:5368',
      chatMenu: '402:5486',
      composer: '402:5403',
      entries: ['402:5385', undefined, '402:5390'],
      sideChat: '402:5430',
      sideNote: '402:5440',
      sideComposer: '402:5456',
      sideEntries: ['402:5441', '402:5443'],
    },
  },
  ui: {
    ...sideChat.ui,
    drag: null,
    menuFor: 'bridge-themes',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
