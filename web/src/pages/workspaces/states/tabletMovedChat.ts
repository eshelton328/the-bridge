// Figma Workbench T13 (420:1361), "T13 · Moved": what picking a workspace in
// Move to workspace's list (T12) leaves on the iPad mini. The menu is closed,
// bridge themes fills the screen as T6's chat does, with no tab bar, still
// Working with Stop, and its header names the-bridge; a toast over the
// composer confirms the move, with Undo. The composer is empty, with Opus 5.5,
// Stop and the focus. Back returns to the list, where bridge themes and theme
// tokens head the-bridge, as in D20. At a desktop width the state draws M1's
// sidebar with bridge themes alone and D20's toast over its composer.
// Starts from T6 (tabletOneChat), with M19's empty composer, D20's move and
// toast (movedChat) and T13's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { movedChat } from './movedChat.ts'
import { tabletOneChat } from './tabletOneChat.ts'

// T6's pane, still Working with Stop, with nothing typed or attached (420:1468).
const panes: WorkbenchPane[] = tabletOneChat.data.panes.map((p) =>
  p.type === 'chat' && p.id === 'bridge-themes' ? { ...p, composer: { ...p.composer, text: '', attachments: [] } } : p,
)

export const tabletMovedChat = {
  title: 'Moved to another workspace on the tablet',
  frames: [{ id: 'T13', node: '420:1361', viewport: 'tablet' }],
  data: {
    ...tabletOneChat.data,
    // D20's move: the chat and the subtask chat listed under it head the-bridge's list, with D20's counts.
    workspaces: movedChat.data.workspaces,
    current: movedChat.data.current,
    panes,
    toast: movedChat.data.toast,
    layers: {
      ...tabletOneChat.data.layers,
      phoneBack: '420:1424',
      chatHead: '420:1422',
      chatActions: '420:1435',
      entries: ['420:1451', undefined, '420:1456'],
      composer: '420:1468',
      toast: 'toast',
    },
  },
  ui: { ...tabletOneChat.ui, focusedPane: 'bridge-themes', toastOpen: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
