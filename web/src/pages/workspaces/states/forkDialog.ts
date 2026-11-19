// Figma Workbench D15 (417:4), "D15 · Fork a chat": D2b's screen without the
// side chat and the menu, bridge themes alone beside the sidebar, and the
// Fork form open over it. The copy's name defaults to "bridge themes · fork",
// and it starts from the whole chat or up to a message the owner picks next;
// Whole chat is chosen. Fork starts nothing. Starts from D2b (chatActions).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const forkDialog = {
  title: 'Fork a chat',
  frames: [{ id: 'D15', node: '417:4', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    fork: {
      title: 'Fork {chat}',
      labels: { name: 'NAME', startFrom: 'START FROM' },
      name: { value: '{chat} · fork', hint: 'you can rename it later' },
      startFrom: {
        options: [
          { value: 'whole', label: 'Whole chat' },
          { value: 'upTo', label: 'Up to a message…' },
        ],
        value: 'whole',
      },
      note: 'The fork copies the messages and the context. The original keeps running.',
      cancel: 'Cancel',
      submit: 'Fork',
    },
    layers: {
      sidebar: '417:46',
      toggle: '417:49',
      newWorkspace: '417:54',
      headers: {
        'omni-brain': '417:58',
        'the-bridge': '417:132',
        omni: '417:175',
        'skill-evals': '417:210',
      },
      rows: {
        'bridge-themes': '417:76',
        'theme-tokens': '417:90',
        'drift-check': '417:105',
        'brain-git': '417:121',
        'hono-server': '417:150',
        'dev-server': '417:164',
        'release-notes': '417:194',
      },
      mainChat: '417:227',
      chatHead: '417:228',
      chatActions: '417:239',
      composer: '417:274',
      entries: ['417:256', undefined, '417:261'],
    },
  },
  ui: {
    ...chatActions.ui,
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
    chatDialog: 'fork',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
