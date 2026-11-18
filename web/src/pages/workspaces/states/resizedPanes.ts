// Figma Workbench D14 (402:6509), "D14 · Resize panes": the screen of D13
// after the empty pane closes. Brain git takes the whole bottom row, and
// bridge themes (focused) and drift check share the top row. Erik drags the
// handle between them: bridge themes takes 60 % of the row, and the readout
// beside the pointer shows the split as a ratio and that a double-click
// shares it equally. Starts from D13 (emptiedPane) with D11's (threePanes)
// panes and status bar, in a rows-first split.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { emptiedPane } from './emptiedPane.ts'
import { threePanes } from './threePanes.ts'

export const resizedPanes = {
  title: 'Resize panes: brain git takes the bottom row and the top row splits 60 : 40',
  frames: [{ id: 'D14', node: '402:6509', viewport: 'desktop' }],
  data: {
    ...emptiedPane.data,
    panes: threePanes.data.panes,
    status: threePanes.data.status,
    split: 'rows',
    resizeHint: '{ratio}  ·  double-click for 50 : 50',
    layers: {
      sidebar: '402:6650',
      toggle: '402:6653',
      newWorkspace: '402:6658',
      newChat: '402:6977',
      headers: {
        'omni-brain': '402:6662',
        'the-bridge': '402:6736',
        omni: '402:6779',
        'skill-evals': '402:6814',
      },
      rows: {
        'bridge-themes': '402:6680',
        'theme-tokens': '402:6694',
        'drift-check': '402:6709',
        'brain-git': '402:6725',
        'hono-server': '402:6754',
        'dev-server': '402:6768',
        'release-notes': '402:6798',
      },
      // By place in `panes`: bridge themes and drift check in the top row, brain git in the bottom row.
      panes: ['402:6993', '402:7064', '402:7118'],
      paneChats: [
        { composer: '402:7036', entries: ['402:7018', '402:7020', '402:7023'] },
        { composer: '402:7106', entries: [undefined, '402:7093'] },
      ],
      shell: '402:7139',
      resizeHint: '402:7151',
    },
  },
  ui: { ...emptiedPane.ui, resize: { part: 'top', sizes: [60, 40] } },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
