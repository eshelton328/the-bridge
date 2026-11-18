// Figma Workbench D13 (402:5812), "D13 · Close an empty pane": the four
// panes of D12 after the drop, with no chat dragged. A pane empties when its
// chat ends or moves to another workspace, and the layout stays as it is:
// bridge themes (focused), drift check and brain git keep their place, and
// the empty pane at the bottom right offers a new chat, a chat of this
// workspace, and Close pane with its shortcut Cmd+W at its top right. Starts
// from D12 (fourPanes), without its drag: D11's (threePanes) data with D12's
// panes and status bar.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { fourPanes } from './fourPanes.ts'
import { threePanes } from './threePanes.ts'

const withClose = (pane: WorkbenchPane): WorkbenchPane =>
  pane.type === 'empty' ? { ...pane, close: { label: 'Close pane', shortcut: 'Cmd+W' } } : pane

export const emptiedPane = {
  title: 'An emptied pane keeps its place and offers Close pane',
  frames: [{ id: 'D13', node: '402:5812', viewport: 'desktop' }],
  data: {
    ...threePanes.data,
    panes: fourPanes.data.panes.map(withClose),
    status: fourPanes.data.status,
    layers: {
      sidebar: '402:5953',
      toggle: '402:5956',
      newWorkspace: '402:5961',
      newChat: '402:6280',
      headers: {
        'omni-brain': '402:5965',
        'the-bridge': '402:6039',
        omni: '402:6082',
        'skill-evals': '402:6117',
      },
      rows: {
        'bridge-themes': '402:5983',
        'theme-tokens': '402:5997',
        'drift-check': '402:6012',
        'brain-git': '402:6028',
        'hono-server': '402:6057',
        'dev-server': '402:6071',
        'release-notes': '402:6101',
      },
      // By place in `panes`: bridge themes, drift check, the empty pane, brain git.
      panes: ['402:6296', '402:6367', '402:6453', '402:6422'],
      paneChats: [
        { composer: '402:6339', entries: ['402:6321', '402:6323', '402:6326'] },
        { composer: '402:6409', entries: [undefined, '402:6396'] },
      ],
      shell: '402:6443',
      emptyRows: ['402:6474', '402:6488'],
      emptyClose: { close: '402:6502', shortcut: '402:6504' },
    },
  },
  ui: { ...threePanes.ui },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
