// Figma Workbench D9 (402:1145), "D9 · Two panes side by side": the screen of
// D7 after drift check is dropped on the right of bridge themes (D8). The
// split has two panes side by side, each at half the width, with the resize
// handle in the gap between them: bridge themes, focused, on the left and
// drift check, waiting for an approval, on the right. Starts from D7
// (chatInWorkbench), with D1's (workbench) drift check pane.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatInWorkbench } from './chatInWorkbench.ts'
import { workbench } from './workbench.ts'

const [bridgeThemes, driftCheck] = workbench.data.panes

export const twoPanes = {
  title: 'Two panes side by side',
  frames: [{ id: 'D9', node: '402:1145', viewport: 'desktop' }],
  data: {
    ...chatInWorkbench.data,
    panes: [bridgeThemes, driftCheck].filter((pane) => pane !== undefined),
    status: { ...workbench.data.status, summary: 'omni-brain · 2 panes' },
    layers: {
      sidebar: '402:1286',
      toggle: '402:1289',
      newWorkspace: '402:1294',
      newChat: '402:1613',
      headers: {
        'omni-brain': '402:1298',
        'the-bridge': '402:1372',
        omni: '402:1415',
        'skill-evals': '402:1450',
      },
      rows: {
        'bridge-themes': '402:1316',
        'theme-tokens': '402:1330',
        'drift-check': '402:1345',
        'brain-git': '402:1361',
        'hono-server': '402:1390',
        'dev-server': '402:1404',
        'release-notes': '402:1434',
      },
      panes: ['402:1628', '402:1699'],
      paneChats: [
        { composer: '402:1671', entries: ['402:1653', '402:1655', '402:1658'] },
        { composer: '402:1741', entries: [undefined, '402:1728'] },
      ],
    },
  },
  ui: { ...chatInWorkbench.ui },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
