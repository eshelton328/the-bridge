// Figma Workbench M6 (105:3151), "M6 · Subagents": bridge themes' subagents
// on the phone, which Subagents in the chat actions opens. The back row
// returns to bridge themes; under the title, "3 · 2 running". The cards are
// D3's: Map requirements (Done), Layout notes (Running, its transcript open,
// with Hide transcript and Stop) and Subtask: theme tokens (Running, with its
// description, Transcript and Stop), each with a chevron to its full
// transcript (M12). There is no tab bar. At a desktop width the state draws
// M1's sidebar with bridge themes alone and the subagents panel beside it.
// Starts from M4 (phoneChatActions), without the actions sheet, with D3's
// subagents (subagents).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChatActions } from './phoneChatActions.ts'
import { subagents } from './subagents.ts'

export const phoneSubagents = {
  title: "A chat's subagents on the phone",
  frames: [{ id: 'M6', node: '105:3151', viewport: 'phone' }],
  data: {
    ...phoneChatActions.data,
    subagents: {
      ...subagents.data.subagents,
      running: 'running',
      openTranscript: 'Open the transcript of',
    },
    layers: {
      ...phoneChatActions.data.layers,
      sheetIcons: undefined,
      phoneBack: '105:3177',
      subagentsHeader: '105:3176',
      subagentsTitle: '105:3181',
      subagentsCount: '105:3185',
      subagentCards: {
        'map-requirements': '105:3187',
        'layout-notes': '105:3200',
        'theme-tokens': '105:3223',
      },
      subagentChevrons: {
        'map-requirements': '147:15',
        'layout-notes': '147:17',
        'theme-tokens': '147:19',
      },
    },
  },
  ui: {
    ...phoneChatActions.ui,
    menuFor: null,
    moveOpen: false,
    moveTarget: null,
    phoneView: 'subagents',
    subagentsOpen: true,
    transcripts: ['layout-notes'],
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
