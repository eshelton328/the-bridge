// Figma Workbench D20 (417:1835), "D20 · Moved": what Move to workspace (D19)
// does when the owner picks the-bridge. bridge themes and its subtask chat, theme
// tokens, now head THE-BRIDGE's list, and OMNI-BRAIN keeps drift check and
// brain git; the chat stays selected and shown alone, Working, and its header
// names the-bridge. A toast over the composer confirms the move, with Undo.
// The pointer rests on omni's header. Starts from D2b (chatActions), without
// the side chat and the menu. The workspaces' last chats (R6) move too.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'
import { workbench } from './workbench.ts'

// The chats that move: the chat and the subtask chat listed under it.
const moved = new Set(['bridge-themes', 'theme-tokens'])
const movedChats = chatActions.data.workspaces.flatMap((w) => w.chats.filter((c) => moved.has(c.id)))
const counts: Record<string, number> = { 'omni-brain': 2, 'the-bridge': 3 }

const workspaces = chatActions.data.workspaces.map((w) => {
  const kept = w.chats.filter((c) => !moved.has(c.id))
  return {
    ...w,
    count: counts[w.id] ?? w.count,
    chats: w.id === 'the-bridge' ? [...movedChats, ...kept] : kept,
  }
})

// omni-brain's first chat after the move, D1's drift check pane.
const driftCheck = workbench.data.panes.find((p) => p.id === 'drift-check')

/**
 * D20's move in the workspaces' last chats (R6), which a state that moves bridge themes inherits from D1: bridge themes,
 * as the state's `panes` draw it, is now the-bridge's last chat, and omni-brain's is drift check, the first chat it kept.
 */
export function moveLastChats(
  lastChats: Record<string, WorkbenchPane> | undefined,
  panes: readonly WorkbenchPane[],
): Record<string, WorkbenchPane> {
  const chat = panes.find((p) => p.id === 'bridge-themes')
  return {
    ...lastChats,
    ...(chat === undefined ? {} : { 'the-bridge': chat }),
    ...(driftCheck === undefined ? {} : { 'omni-brain': driftCheck }),
  }
}

export const movedChat = {
  title: 'Moved to another workspace',
  frames: [{ id: 'D20', node: '417:1835', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    workspaces,
    current: 'the-bridge',
    lastChats: moveLastChats(chatActions.data.lastChats, chatActions.data.panes),
    toast: { text: 'Moved bridge themes to the-bridge', action: 'Undo' },
    layers: {
      sidebar: '417:1877',
      toggle: '417:1880',
      newWorkspace: '417:1885',
      headers: {
        'omni-brain': '417:1889',
        'the-bridge': '417:1963',
        omni: '417:2006',
        'skill-evals': '417:2041',
      },
      rows: {
        'drift-check': '417:1936',
        'brain-git': '417:1952',
        'bridge-themes': '417:1907',
        'theme-tokens': '417:1921',
        'hono-server': '417:1981',
        'dev-server': '417:1995',
        'release-notes': '417:2025',
      },
      mainChat: '417:2058',
      chatHead: '417:2059',
      chatActions: '417:2070',
      composer: '417:2105',
      entries: ['417:2087', undefined, '417:2092'],
      toast: 'toast · moved',
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'bridge-themes',
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
    toastOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
