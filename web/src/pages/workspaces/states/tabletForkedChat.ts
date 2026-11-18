// Figma Workbench T9 (420:636), "T9 · Forked chat": what Fork (T8) opens on
// the iPad mini. The fork, bridge themes · fork, opens in place of the
// original and fills the screen as T6's chat does, with no tab bar: the header
// with the back button, the title over "omni-brain · forked from bridge
// themes", Idle and the ⋯, then Opus 5.5 and the context used; the copied
// messages, the line where it was forked, and the empty composer with Opus 5.5
// and the focus, and no Stop. Back returns to the list, where the fork is
// under bridge themes with D16's fork mark. At a desktop width the state draws
// M1's sidebar with the fork alone. Starts from T6 (tabletOneChat), with
// D16's fork (forkedChat), M19's empty composer and T9's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { forkedChat } from './forkedChat.ts'
import { tabletOneChat } from './tabletOneChat.ts'

const forkId = 'bridge-themes-fork'
const fork = forkedChat.data.workspaces.flatMap((w) => w.chats).find((c) => c.id === forkId)

// D16's fork row under bridge themes, in the tablet's list.
const workspaces = tabletOneChat.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'bridge-themes')
  return at === -1 || fork === undefined
    ? w
    : { ...w, chats: [...chats.slice(0, at + 1), fork, ...chats.slice(at + 1)] }
})

// T6's pane, copied: Idle, so no Stop, nothing typed or attached, D16's origin and the line where it was forked (420:769).
const panes: WorkbenchPane[] = tabletOneChat.data.panes.flatMap((p) =>
  p.type === 'chat' && p.id === 'bridge-themes'
    ? [
        {
          ...p,
          id: forkId,
          head: {
            ...p.head,
            title: 'bridge themes · fork',
            status: { label: 'Idle', tone: 'idle' },
            origin: 'forked from bridge themes',
          },
          entries: [
            ...p.entries,
            { type: 'event', label: 'Forked', text: 'Forked from bridge themes here · the messages above are a copy' },
          ],
          composer: { ...p.composer, text: '', attachments: [], running: false },
        },
        p,
      ]
    : [p],
)

export const tabletForkedChat = {
  title: 'A forked chat on the tablet, Idle',
  frames: [{ id: 'T9', node: '420:636', viewport: 'tablet' }],
  data: {
    ...tabletOneChat.data,
    workspaces,
    panes,
    layers: {
      ...tabletOneChat.data.layers,
      phoneBack: '420:699',
      chatHead: '420:697',
      chatActions: '420:710',
      entries: ['420:726', undefined, '420:731', '420:769'],
      composer: '420:743',
    },
  },
  ui: { ...tabletOneChat.ui, focusedPane: forkId },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
