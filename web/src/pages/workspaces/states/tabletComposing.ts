// Figma Workbench T4 (105:2096), "T4 · Composing": bridge themes on the iPad
// mini while Erik types, with the keyboard up. The chat fills the screen as
// on the phone, with no tab bar: the header with the back button, the title
// over omni-brain, Working and the ⋯, then Opus 5.5 and the context used;
// Erik's message, the read line, Claude's reply with Copy and Claude's second
// reply, "Writing the layout notes now; the subtask is drafting the theme
// tokens." Erik has attached requirements.md, which shows above the message,
// and typed "/", so the skills are listed over the composer with /writer
// highlighted; Stop shows while the chat works. The keyboard itself is the
// tablet's (d-089). Starts from T2b (tabletChatActions), without the menu,
// with M3's "/" typed, requirements.md attached and the skills listed; at a
// desktop width it draws M1's sidebar with bridge themes alone and its skills
// open.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChat } from './phoneChat.ts'
import { tabletChatActions } from './tabletChatActions.ts'

// T2b's chat with Claude's second reply, which has no Copy (105:2239), and M3's composer: "/" typed after
// requirements.md was attached (105:2261), with T2b's model chip.
const bridgeThemes: WorkbenchPane[] = tabletChatActions.data.panes.map((p) =>
  p.type === 'chat'
    ? {
        ...p,
        entries: [
          ...p.entries,
          {
            type: 'assistant',
            kind: 'claude',
            name: 'Claude',
            text: 'Writing the layout notes now; the subtask is drafting the theme tokens.',
          },
        ],
        composer: {
          ...p.composer,
          text: '/',
          attachments: ['requirements.md'],
        },
      }
    : p,
)

export const tabletComposing = {
  title: 'A chat on the tablet while Erik types, with the skills listed after "/"',
  frames: [{ id: 'T4', node: '105:2096', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    panes: bridgeThemes,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '105:2159',
      chatHead: '105:2157',
      chatActions: '105:2170',
      entries: ['105:2222', undefined, '105:2227', '105:2239'],
      chatMenu: undefined,
      skills: '105:2246',
      composer: '105:2261',
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    skillsFor: phoneChat.ui.skillsFor,
    skill: phoneChat.ui.skill,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
