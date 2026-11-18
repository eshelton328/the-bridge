// Figma Workbench T3 (105:1959), "T3 · Subagents": bridge themes' subagents
// on the iPad mini, which Subagents in the chat actions opens. The back row
// returns to bridge themes; under the title, "3 · 2 running · started from
// bridge themes". The cards are D3's: Map requirements (Done, with
// Transcript), Layout notes (Running, its transcript open, with Hide
// transcript and Stop) and Subtask: theme tokens (Running, with its
// description, Transcript and Stop), with no chevrons; Start a subtask
// follows them and opens D17's Subtask form over the chat. There is no tab
// bar. Starts from T2b (tabletChatActions), without the chat actions menu,
// with M6's subagents (phoneSubagents) and D17's Subtask form
// (subtaskDialog); at a desktop width it draws M1's sidebar with bridge
// themes alone and the subagents panel beside it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneSubagents } from './phoneSubagents.ts'
import { subtaskDialog } from './subtaskDialog.ts'
import { tabletChatActions } from './tabletChatActions.ts'

export const tabletSubagents = {
  title: "A chat's subagents on the tablet, with Start a subtask",
  frames: [{ id: 'T3', node: '105:1959', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    subagents: {
      ...phoneSubagents.data.subagents,
      // Figma's tablet cards have no chevron to the full transcript (105:2032).
      openTranscript: undefined,
      startedFrom: 'started from',
      startSubtask: 'Start a subtask',
    },
    subtask: subtaskDialog.data.subtask,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '105:2021',
      subagentsHeader: '105:2020',
      subagentsTitle: '105:2025',
      subagentsCount: '105:2029',
      subagentCards: {
        'map-requirements': '105:2031',
        'layout-notes': '105:2044',
        'theme-tokens': '105:2067',
      },
      subagentChevrons: undefined,
      subagentsStart: '105:2087',
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    phoneView: 'subagents',
    subagentsOpen: true,
    transcripts: ['layout-notes'],
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
