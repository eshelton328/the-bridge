// Figma Workbench D5 (158:18), "D5 · Side chat in split panes": the four
// panes of D1 with no menu or skill list open. The side chat (/btw) of
// bridge themes opens inside that pane, over the chat's right side, with
// "Open as its own pane" over its composer; the other panes keep running.
// Starts from D1 (workbench).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { workbench } from './workbench.ts'

export const sideChatInPane = {
  title: 'Side chat in split panes',
  frames: [{ id: 'D5', node: '158:18', viewport: 'desktop' }],
  data: {
    ...workbench.data,
    sideChat: {
      title: 'Side chat',
      command: '/btw',
      note: 'Beside bridge themes only. The other panes keep running.',
      closeLabel: 'Close the side chat',
      entries: [
        { type: 'user', text: 'Does Viewscreen need a light variant?' },
        {
          type: 'assistant',
          kind: 'claude',
          name: 'Claude',
          text: 'Not for the three target screens yet. Keep one dark theme until you ask for a light one.',
        },
      ],
      composer: { placeholder: 'Ask a side question', text: '', attachments: [], running: false },
      pane: 'bridge-themes',
      openAsPane: 'Open as its own pane',
    },
    layers: {
      toggle: '158:119',
      newChat: '158:168',
      panes: ['158:186', '158:271', '158:357', '158:326'],
      paneChats: [
        { composer: '158:239', entries: ['158:219', undefined, '158:224'] },
        { composer: '158:313', entries: [undefined, '158:300'] },
      ],
      shell: '158:347',
      emptyRows: ['158:380', '158:394'],
      sideChat: '158:518',
      sideNote: '158:530',
      sideComposer: '158:545',
      sideEntries: ['158:531', '158:533'],
    },
  },
  ui: {
    ...workbench.ui,
    menuFor: null,
    moveOpen: false,
    moveTarget: null,
    skillsFor: null,
    skill: null,
    sideChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
