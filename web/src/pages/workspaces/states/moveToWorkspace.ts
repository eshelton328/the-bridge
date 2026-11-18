// Figma Workbench D19 (417:1440), "D19 · Move to workspace": the ⋯ menu of
// bridge themes open on Move to workspace, whose list of the other
// workspaces (the-bridge, omni, skill-evals, then New workspace…) opens
// beside the menu, with the-bridge highlighted. Starts from D2b
// (chatActions), without the side chat.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const moveToWorkspace = {
  title: 'Move to workspace',
  frames: [{ id: 'D19', node: '417:1440', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    layers: {
      sidebar: '417:1482',
      toggle: '417:1485',
      newWorkspace: '417:1490',
      headers: {
        'omni-brain': '417:1494',
        'the-bridge': '417:1568',
        omni: '417:1611',
        'skill-evals': '417:1646',
      },
      rows: {
        'bridge-themes': '417:1512',
        'theme-tokens': '417:1526',
        'drift-check': '417:1541',
        'brain-git': '417:1557',
        'hono-server': '417:1586',
        'dev-server': '417:1600',
        'release-notes': '417:1630',
      },
      mainChat: '417:1663',
      chatHead: '417:1664',
      chatActions: '417:1675',
      chatMenu: '417:1740',
      composer: '417:1710',
      entries: ['417:1692', undefined, '417:1697'],
    },
  },
  ui: {
    ...chatActions.ui,
    sideChatOpen: false,
    menuFor: 'bridge-themes',
    menuHighlight: 'move',
    moveOpen: true,
    moveTarget: 'the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
