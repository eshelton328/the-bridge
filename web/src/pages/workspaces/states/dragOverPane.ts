// Figma Workbench D8 (402:559), "D8 · Drag a chat over a pane": the screen of
// D7, with the sidebar beside the workbench and bridge themes in its one pane.
// The owner drags drift check from the sidebar over the right half of the pane: its
// row in the sidebar fades, and that half is the drop zone, a dashed outline
// that says the chat would open to the right and split bridge themes, with no
// icon and no hint, and the dragged chat under the pointer. Starts from D7
// (chatInWorkbench), with the drag of D6 (dragIntoPane).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatInWorkbench } from './chatInWorkbench.ts'

export const dragOverPane = {
  title: 'Drag a chat over a pane',
  frames: [{ id: 'D8', node: '402:559', viewport: 'desktop' }],
  data: {
    ...chatInWorkbench.data,
    paneDrop: {
      title: 'Open {chat} to the right',
      text: 'splits {target} into two panes side by side',
      icon: false,
    },
    layers: {
      sidebar: '402:700',
      toggle: '402:703',
      newWorkspace: '402:708',
      newChat: '402:1027',
      headers: {
        'omni-brain': '402:712',
        'the-bridge': '402:786',
        omni: '402:829',
        'skill-evals': '402:864',
      },
      rows: {
        'bridge-themes': '402:730',
        'theme-tokens': '402:744',
        'drift-check': '402:759',
        'brain-git': '402:775',
        'hono-server': '402:804',
        'dev-server': '402:818',
        'release-notes': '402:848',
      },
      panes: ['402:1041'],
      paneChats: [{ composer: '402:1084', entries: ['402:1066', '402:1068', '402:1071'] }],
      dropZone: { zone: '402:1112', preview: '402:1126' },
    },
  },
  ui: {
    ...chatInWorkbench.ui,
    paneDrag: { chat: 'drift-check', edge: 'right', pane: 'bridge-themes' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
