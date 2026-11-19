// Figma Workbench T2 (105:1749), "T2 · Chat and side chat": the side chat on
// the iPad mini, a sheet over bridge themes, which keeps working under it. The
// chat fills the screen as on the phone, with no tab bar: the header with the
// back button, the title over omni-brain, Working and the ⋯, then Opus 5.5 and
// the context used; the owner's message, the read line and Claude's reply with Copy.
// The sheet has the bubble, Side chat and /btw with ×, the note "Nothing here
// enters bridge themes. Close the sheet and the main chat carries on.", the owner's
// question and Claude's answer with Copy, and the composer. Starts from M5
// (phoneSideChat) with T2's note, drawn at the tablet's width (`tabletList`);
// at a desktop width it draws M1's sidebar with bridge themes alone and the
// side chat beside it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneSideChat } from './phoneSideChat.ts'

export const tabletSideChat = {
  title: 'The side chat on the tablet, in a sheet over the main chat',
  frames: [{ id: 'T2', node: '105:1749', viewport: 'tablet' }],
  data: {
    ...phoneSideChat.data,
    tabletList: true,
    sideChat: {
      ...phoneSideChat.data.sideChat,
      note: 'Nothing here enters bridge themes. Close the sheet and the main chat carries on.',
    },
    layers: {
      ...phoneSideChat.data.layers,
      phoneBack: '105:1812',
      chatHead: '105:1810',
      chatActions: '105:1827',
      entries: ['105:1895', undefined, '105:1900'],
      sideHeader: '105:1917',
      sideNote: '105:1928',
      sideEntries: ['105:1929', '105:1931'],
      sideComposer: '105:1944',
    },
  },
  ui: { ...phoneSideChat.ui },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
