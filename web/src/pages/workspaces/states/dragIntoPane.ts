// Figma Workbench D6 (158:552), "D6 · Drag a chat into a pane": the screen of
// D2b with the chat actions menu closed and no side chat. Erik drags hono
// server from the sidebar onto bridge themes, the chat shown alone: its row
// in the sidebar fades, and the right half of the chat is the drop zone,
// which says the chat would open beside bridge themes, with the hint on
// where to drop and the dragged chat under the pointer. The pointer rested
// on omni's header, which shows rename and close. Starts from D2b
// (chatActions).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const dragIntoPane = {
  title: 'Drag a chat into a pane',
  frames: [{ id: 'D6', node: '158:552', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    paneDrop: {
      title: 'Open {chat} beside {target}',
      text: 'splits the view into two panes',
      hint: 'edge: split beside, above or below · middle: replace this chat',
    },
    layers: {
      sidebar: '158:652',
      toggle: '158:654',
      newWorkspace: '158:662',
      headers: {
        'omni-brain': '158:668',
        'the-bridge': '158:732',
        omni: '158:775',
        'skill-evals': '158:812',
      },
      rows: {
        'bridge-themes': '158:688',
        'theme-tokens': '204:2',
        'drift-check': '158:705',
        'brain-git': '158:721',
        'hono-server': '158:750',
        'dev-server': '158:764',
        'release-notes': '158:796',
      },
      mainChat: '158:829',
      chatHead: '158:830',
      chatActions: '401:11',
      composer: '158:934',
      entries: ['158:914', '158:916', '158:919'],
    },
  },
  ui: {
    ...chatActions.ui,
    menuFor: null,
    sideChatOpen: false,
    paneDrag: { chat: 'hono-server', edge: 'right' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
