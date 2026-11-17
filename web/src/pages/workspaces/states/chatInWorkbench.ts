// Figma Workbench D7 (402:3), "D7 · One chat in the workbench": the sidebar of
// D2b with no menu open, beside the workbench in place of the chat alone. The
// workspace tabs, one pane and the status bar show; bridge themes, opened from
// the sidebar, fills the panes area, with requirements.md attached and "/"
// typed. The pointer rests on omni's header, which shows rename and close.
// Starts from D2b (chatActions), with D1's (workbench) bridge themes pane.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'
import { workbench } from './workbench.ts'

const [bridgeThemes] = workbench.data.panes

export const chatInWorkbench = {
  title: 'One chat in the workbench',
  frames: [{ id: 'D7', node: '402:3', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    panes: bridgeThemes === undefined ? [] : [bridgeThemes],
    status: { ...workbench.data.status, summary: 'omni-brain · 1 pane' },
    layers: {
      sidebar: '402:144',
      toggle: '402:147',
      newWorkspace: '402:152',
      newChat: '402:471',
      headers: {
        'omni-brain': '402:156',
        'the-bridge': '402:230',
        omni: '402:273',
        'skill-evals': '402:308',
      },
      rows: {
        'bridge-themes': '402:174',
        'theme-tokens': '402:188',
        'drift-check': '402:203',
        'brain-git': '402:219',
        'hono-server': '402:248',
        'dev-server': '402:262',
        'release-notes': '402:292',
      },
      panes: ['402:485'],
      paneChats: [{ composer: '402:528', entries: ['402:510', '402:512', '402:515'] }],
    },
  },
  ui: {
    ...chatActions.ui,
    menuFor: null,
    sideChatOpen: false,
    workbench: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
