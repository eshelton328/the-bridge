// Figma Workbench D2 (105:511), "Workspaces and side chat": the sidebar lists
// every workspace and its chats, with theme tokens indented under bridge
// themes, the chat that started it. Erik drags drift check onto the-bridge,
// whose header is the drop target, and the pointer rests on omni, whose
// header shows rename and close. bridge themes fills the middle, and its
// side chat (/btw) sits beside it. Starts from D1 (workbench).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { workbench } from './workbench.ts'

const [first] = workbench.data.panes
const bridgeThemes: WorkbenchPane[] =
  first?.type === 'chat'
    ? [{ ...first, composer: { ...first.composer, text: '', attachments: ['theme-ideas.md'] } }]
    : []

export const sideChat = {
  title: 'Workspaces and side chat',
  frames: [{ id: 'D2', node: '105:511', viewport: 'desktop' }],
  data: {
    ...workbench.data,
    workspaces: [
      {
        id: 'omni-brain',
        label: 'omni-brain',
        count: 3,
        needsYou: true,
        chats: [
          {
            id: 'bridge-themes',
            kind: 'claude',
            title: 'bridge themes',
            model: 'Opus 5.5',
            context: 42,
            status: { label: 'Working', tone: 'working' },
          },
          {
            id: 'theme-tokens',
            kind: 'claude',
            title: 'theme tokens',
            model: 'Opus 5.5',
            context: 26,
            status: { label: 'Running', tone: 'running' },
            level: 1,
          },
          {
            id: 'drift-check',
            kind: 'codex',
            title: 'drift check',
            model: 'GPT-5.5',
            context: 23,
            status: { label: 'Needs you', tone: 'needsYou' },
          },
          {
            id: 'brain-git',
            kind: 'shell',
            title: 'brain git',
            model: 'shell · zsh',
            status: { label: 'Idle', tone: 'idle' },
          },
        ],
      },
      {
        id: 'the-bridge',
        label: 'the-bridge',
        count: 2,
        needsYou: true,
        chats: [
          {
            id: 'hono-server',
            kind: 'claude',
            title: 'hono server',
            model: 'Sonnet 5.5',
            context: 78,
            status: { label: 'Needs you', tone: 'needsYou' },
          },
          {
            id: 'dev-server',
            kind: 'shell',
            title: 'dev server',
            model: 'shell · pnpm dev',
            status: { label: 'Running', tone: 'running' },
          },
        ],
      },
      {
        id: 'omni',
        label: 'omni',
        count: 1,
        needsYou: false,
        chats: [
          {
            id: 'release-notes',
            kind: 'codex',
            title: 'release notes',
            model: 'GPT-5.5',
            context: 18,
            status: { label: 'Done', tone: 'done' },
          },
        ],
      },
      {
        id: 'skill-evals',
        label: 'skill-evals',
        count: 1,
        needsYou: false,
        // Figma draws skill-evals closed, so its chat is not known.
        chats: [],
      },
    ],
    panes: bridgeThemes,
    sidebar: {
      title: 'Workspaces',
      hide: 'Hide the workspace sidebar',
      newWorkspace: 'New workspace',
      dropHint: 'Drop to move {chat} into {workspace}',
      contextLabel: 'context',
    },
    sideChat: {
      title: 'Side chat',
      command: '/btw',
      note: 'A quick question beside bridge themes. Nothing here enters the main chat, and the main chat keeps running.',
      closeLabel: 'Close the side chat',
      entries: [
        { type: 'user', text: 'Can Panda CSS switch themes while the app runs?' },
        {
          type: 'assistant',
          kind: 'claude',
          name: 'Claude',
          text: 'Only through CSS variables. Panda builds its classes ahead of time, so a runtime theme swaps the token variables.',
          copy: 'Copy',
        },
      ],
      composer: { placeholder: 'Ask a side question', text: '', attachments: [], running: false },
    },
  },
  ui: {
    ...workbench.ui,
    menuFor: null,
    moveOpen: false,
    moveTarget: null,
    skillsFor: null,
    skill: null,
    sidebar: true,
    collapsed: ['skill-evals'],
    hovered: 'omni',
    drag: { chat: 'drift-check', over: 'the-bridge' },
    sideChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
