// Figma Workbench T6 (402:10343), "T6 · One chat at a time": bridge themes
// open full screen on the iPad mini, which has no split panes and no drop
// targets. The chat fills the screen as on the phone, with no tab bar: the
// header with the back button, the title over omni-brain, Working and the ⋯,
// then Opus 5.5 and the context used; Erik's message, the read line and
// Claude's reply with Copy, and the composer with requirements.md attached
// and "/" typed, in focus, with no skill list open; Stop shows while the chat
// works. Back returns to the list. Starts from T2b (tabletChatActions),
// without the menu, with T4's composer and M17's focus in the message box; at
// a desktop width it draws M1's sidebar with bridge themes alone.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { tabletChatActions } from './tabletChatActions.ts'

// T2b's chat with T4's composer: "/" typed after requirements.md was attached (402:15201).
const bridgeThemes: WorkbenchPane[] = tabletChatActions.data.panes.map((p) =>
  p.type === 'chat' ? { ...p, composer: { ...p.composer, text: '/', attachments: ['requirements.md'] } } : p,
)

export const tabletOneChat = {
  title: 'A chat full screen on the tablet, with no split panes',
  frames: [{ id: 'T6', node: '402:10343', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    panes: bridgeThemes,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '402:10406',
      chatHead: '402:10404',
      chatActions: '402:10417',
      entries: ['402:10433', undefined, '402:10438'],
      chatMenu: undefined,
      composer: '402:15201',
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    skillsFor: null,
    skill: null,
    messageFocus: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
