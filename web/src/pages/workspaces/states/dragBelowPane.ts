// Figma Workbench D10 (402:3029), "D10 · Drag a third chat below a pane": the
// two panes of D9, bridge themes and drift check side by side. Erik drags brain
// git from the sidebar near the bottom edge of drift check: its row fades, and
// the drop zone is the lower half of drift check alone, the pane under the
// pointer, so the drop would split only that pane and bridge themes keeps its
// full height. The zone says brain git would open below drift check, with no
// icon and no hint, and the dragged chat is under the pointer. Starts from D9
// (twoPanes), with the drag over a pane of D8 (dragOverPane).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { twoPanes } from './twoPanes.ts'

export const dragBelowPane = {
  title: 'Drag a third chat below a pane',
  frames: [{ id: 'D10', node: '402:3029', viewport: 'desktop' }],
  data: {
    ...twoPanes.data,
    paneDrop: {
      title: 'Open {chat} below {target}',
      text: 'splits {target} into two panes, one above the other',
      icon: false,
    },
    layers: {
      sidebar: '402:3170',
      toggle: '402:3173',
      newWorkspace: '402:3178',
      newChat: '402:3497',
      headers: {
        'omni-brain': '402:3182',
        'the-bridge': '402:3256',
        omni: '402:3299',
        'skill-evals': '402:3334',
      },
      rows: {
        'bridge-themes': '402:3200',
        'theme-tokens': '402:3214',
        'drift-check': '402:3229',
        'brain-git': '402:3245',
        'hono-server': '402:3274',
        'dev-server': '402:3288',
        'release-notes': '402:3318',
      },
      panes: ['402:3512', '402:3583'],
      paneChats: [
        { composer: '402:3555', entries: ['402:3537', '402:3539', '402:3542'] },
        { composer: '402:3625', entries: [undefined, '402:3612'] },
      ],
      dropZone: { zone: '402:3637', preview: '402:3651' },
    },
  },
  ui: {
    ...twoPanes.ui,
    paneDrag: { chat: 'brain-git', edge: 'bottom', pane: 'drift-check' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
