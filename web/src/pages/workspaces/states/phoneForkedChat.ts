// Figma Workbench M19 (422:309), "M19 · Forked chat": what Fork (M18) opens on
// the phone. The fork, bridge themes · fork, fills the screen as M17's chat
// does: omni-brain · forked under its title, Idle and the ⋯, the copied
// messages, the line where it was forked, and the composer with
// requirements.md attached, the placeholder and the focus, and no Stop. Back
// returns to the list, where the fork is under bridge themes with D16's fork
// mark. At a desktop width the state draws M1's sidebar with the fork alone.
// Starts from M17 (phoneChatFull), with D16's fork (forkedChat) and M19's
// layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { forkedChat } from './forkedChat.ts'
import { phoneChatFull } from './phoneChatFull.ts'

const forkId = 'bridge-themes-fork'
const fork = forkedChat.data.workspaces.flatMap((w) => w.chats).find((c) => c.id === forkId)

// D16's fork row under bridge themes, in the phone's list.
const workspaces = phoneChatFull.data.workspaces.map((w) => {
  const chats = w.chats
  const at = chats.findIndex((c) => c.id === 'bridge-themes')
  return at === -1 || fork === undefined
    ? w
    : { ...w, chats: [...chats.slice(0, at + 1), fork, ...chats.slice(at + 1)] }
})

// M17's pane, copied: Idle, so no Stop, nothing typed, and the line where it was forked (422:412).
const panes: WorkbenchPane[] = phoneChatFull.data.panes.flatMap((p) =>
  p.type === 'chat' && p.id === 'bridge-themes'
    ? [
        {
          ...p,
          id: forkId,
          head: {
            ...p.head,
            title: 'bridge themes · fork',
            status: { label: 'Idle', tone: 'idle' },
            origin: 'forked',
          },
          entries: [...p.entries, { type: 'event', label: 'Forked', text: 'Forked from bridge themes here' }],
          composer: { ...p.composer, text: '', running: false },
        },
        p,
      ]
    : [p],
)

export const phoneForkedChat = {
  title: 'A forked chat on the phone, Idle',
  frames: [{ id: 'M19', node: '422:309', viewport: 'phone' }],
  data: {
    ...phoneChatFull.data,
    workspaces,
    panes,
    layers: {
      ...phoneChatFull.data.layers,
      phoneBack: '422:336',
      chatHead: '422:334',
      chatActions: '422:347',
      entries: ['422:363', undefined, '422:368'],
      composer: '422:381',
    },
  },
  ui: { ...phoneChatFull.ui, focusedPane: forkId },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
