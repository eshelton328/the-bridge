// Figma Workbench T14 (420:1498), "T14 · Rename chat": what Rename chat in the
// chat actions menu (T2b) leaves on the iPad mini. The menu is closed,
// bridge themes fills the screen as T6's chat does, with no tab bar, still
// Working with Stop, and the name in its header is a field 300 wide with the
// focus, the caret after the name and × at its end, as in D21. Tapping
// outside saves the name; × undoes the change and closes the field, as in the
// list (T1). The composer is empty, with Opus 5.5 and Stop. At a desktop width
// the state draws M1's sidebar with bridge themes alone and D21's field in its
// header.
// Starts from T6 (tabletOneChat), with M19's empty composer, D21's rename
// (renameChat) and T14's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { tabletOneChat } from './tabletOneChat.ts'

// T6's pane, still Working with Stop, with nothing typed or attached (420:1605).
const panes: WorkbenchPane[] = tabletOneChat.data.panes.map((p) =>
  p.type === 'chat' && p.id === 'bridge-themes' ? { ...p, composer: { ...p.composer, text: '', attachments: [] } } : p,
)

export const tabletRenameChat = {
  title: 'Rename a chat on the tablet',
  frames: [{ id: 'T14', node: '420:1498', viewport: 'tablet' }],
  data: {
    ...tabletOneChat.data,
    panes,
    layers: {
      ...tabletOneChat.data.layers,
      phoneBack: '420:1561',
      chatHead: '420:1559',
      chatActions: '420:1572',
      entries: ['420:1588', undefined, '420:1593'],
      composer: '420:1605',
      renameField: 'rename field · chat',
    },
  },
  // The field has the focus, so the message box has none (M23).
  ui: { ...tabletOneChat.ui, focusedPane: 'bridge-themes', messageFocus: false, renaming: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
