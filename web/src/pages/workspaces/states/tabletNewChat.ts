// Figma Workbench T7 (420:191), "T7 · New chat": New chat on the iPad mini,
// D3's form in a dialog centred over bridge themes, which keeps working under
// the scrim. The form has its title and ×, the name with quiet-nebula and
// "random if blank", Runs in (Claude Code, Codex, shell), the workspace
// the-bridge, the folders ~/the-bridge and ~/omni with Add folder, the model
// Sonnet 5.5 · high effort and the first message, in focus, then Cancel and
// Start chat. Under it the chat fills the screen as on the phone, with no tab
// bar: the header with the back button, the title over omni-brain, Working
// and the ⋯, then Opus 5.5 and the context used; Erik's message, the read
// line and Claude's reply with Copy, and the empty composer with Opus 5.5 and
// Stop. Starts from T2b (tabletChatActions), without the menu, with D3's New
// chat form open; at a desktop width it draws M1's sidebar with bridge themes
// alone and D3's form over it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { subagents } from './subagents.ts'
import { tabletChatActions } from './tabletChatActions.ts'

export const tabletNewChat = {
  title: 'New chat on the tablet, in a dialog over the chat',
  frames: [{ id: 'T7', node: '420:191', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    // D3's form: Figma's T7 chooses the-bridge, as D3 does.
    newChat: subagents.data.newChat,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '420:254',
      chatHead: '420:252',
      chatActions: '420:265',
      entries: ['420:281', undefined, '420:286'],
      chatMenu: undefined,
      composer: '420:298',
      newChatDialog: {
        dialog: '420:322',
        fields: {
          name: '420:329',
          runsIn: '420:336',
          workspace: '420:355',
          folders: '420:363',
          model: '420:383',
          message: '420:391',
        },
        boxes: { name: '420:332', workspace: '420:358', model: '420:386', message: '420:394' },
        runsIn: { claude: '420:340', codex: '420:344', shell: '420:350' },
        folders: ['420:367', '420:371'],
        addFolder: '420:378',
        cancel: '420:403',
        start: '420:405',
      },
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    newChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
