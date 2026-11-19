// Figma Workbench T12 (420:1136), "T12 · Move to workspace": T2b's chat
// actions menu under the ⋯ of bridge themes on the iPad mini, open on Move to
// workspace, whose list of the other workspaces (the-bridge, omni,
// skill-evals, then New workspace…) opens beside the menu, on its left, with
// the-bridge highlighted, as on the desktop (D19). The chat keeps working
// behind it: the header with the back button, the title over omni-brain,
// Working and the ⋯, then Opus 5.5 and the context used; the owner's message, the
// read line and Claude's reply with Copy, and the empty composer with Opus
// 5.5 and Stop. Starts from T2b (tabletChatActions), with D19's list open; at
// a desktop width it draws M1's sidebar with bridge themes alone and its chat
// actions menu open on Move to workspace.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { tabletChatActions } from './tabletChatActions.ts'

export const tabletMoveToWorkspace = {
  title: 'Move to workspace on the tablet, its list beside the chat actions menu',
  frames: [{ id: 'T12', node: '420:1136', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '420:1199',
      chatHead: '420:1197',
      chatActions: '420:1210',
      chatMenu: '420:1266',
      entries: ['420:1226', undefined, '420:1231'],
      composer: '420:1243',
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuHighlight: 'move',
    moveOpen: true,
    moveTarget: 'the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
