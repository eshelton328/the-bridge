// Figma Workbench D12 (402:4310), "D12 · Four panes, the most": the workbench
// at its limit of four panes, clockwise from the top left: bridge themes,
// focused, drift check, an empty pane and brain git. The owner drags hono server
// from the sidebar over drift check: its row fades, and with four panes open
// no edge splits, so the drop zone covers the whole pane and says the chat
// would replace drift check, which keeps running in the sidebar. The dragged
// chat is under the pointer at the zone's end. Starts from D11 (threePanes),
// with D1's (workbench) four panes and the drag over a pane of D10
// (dragBelowPane).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { threePanes } from './threePanes.ts'
import { workbench } from './workbench.ts'

export const fourPanes = {
  title: 'Four panes, the most: a chat dragged over a pane replaces it',
  frames: [{ id: 'D12', node: '402:4310', viewport: 'desktop' }],
  data: {
    ...threePanes.data,
    panes: workbench.data.panes,
    status: { ...workbench.data.status, summary: 'omni-brain · 4 panes' },
    paneDrop: {
      title: 'Replace {target} with {chat}',
      text: 'Four panes is the most. {target} keeps running in the sidebar.',
      icon: false,
      preview: 'end',
    },
    layers: {
      sidebar: '402:4451',
      toggle: '402:4454',
      newWorkspace: '402:4459',
      newChat: '402:4778',
      headers: {
        'omni-brain': '402:4463',
        'the-bridge': '402:4537',
        omni: '402:4580',
        'skill-evals': '402:4615',
      },
      rows: {
        'bridge-themes': '402:4481',
        'theme-tokens': '402:4495',
        'drift-check': '402:4510',
        'brain-git': '402:4526',
        'hono-server': '402:4555',
        'dev-server': '402:4569',
        'release-notes': '402:4599',
      },
      // By place in `panes`: bridge themes, drift check, the empty pane, brain git.
      panes: ['402:4794', '402:4865', '402:4951', '402:4920'],
      paneChats: [
        { composer: '402:4837', entries: ['402:4819', '402:4821', '402:4824'] },
        { composer: '402:4907', entries: [undefined, '402:4894'] },
      ],
      shell: '402:4941',
      emptyRows: ['402:4972', '402:4986'],
      dropZone: { zone: '402:5000', preview: '402:5014' },
    },
  },
  ui: {
    ...threePanes.ui,
    paneDrag: { chat: 'hono-server', edge: 'middle', pane: 'drift-check' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
