// Figma Workbench D17 (417:725), "D17 · Start a subtask": D2b's screen
// without the side chat and the menu, bridge themes alone beside the
// sidebar, and the Subtask form open over it, as D15 opens the Fork form.
// The form asks which model runs the subagent (Sonnet 5.5 · high effort)
// and what it should do, with the task typed and the box focused. The
// subtask gets the chat's full context and returns its result here; Start
// subtask starts nothing. Starts from D2b (chatActions).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const subtaskDialog = {
  title: 'Start a subtask',
  frames: [{ id: 'D17', node: '417:725', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    subtask: {
      title: 'Start a subtask',
      labels: { model: 'MODEL', task: 'WHAT SHOULD THE SUBTASK DO?' },
      model: {
        options: [
          { value: 'sonnet-high', label: 'Sonnet 5.5 · high effort' },
          { value: 'opus-high', label: 'Opus 5.5 · high effort' },
        ],
        value: 'sonnet-high',
      },
      task: { value: 'Draft layout notes for the three directions, one page each.' },
      note: 'Gets this chat’s full context. Returns its result here.',
      cancel: 'Cancel',
      submit: 'Start subtask',
    },
    layers: {
      sidebar: '417:767',
      toggle: '417:770',
      newWorkspace: '417:775',
      headers: {
        'omni-brain': '417:779',
        'the-bridge': '417:853',
        omni: '417:896',
        'skill-evals': '417:931',
      },
      rows: {
        'bridge-themes': '417:797',
        'theme-tokens': '417:811',
        'drift-check': '417:826',
        'brain-git': '417:842',
        'hono-server': '417:871',
        'dev-server': '417:885',
        'release-notes': '417:915',
      },
      mainChat: '417:948',
      chatHead: '417:949',
      chatActions: '417:960',
      composer: '417:995',
      entries: ['417:977', undefined, '417:982'],
    },
  },
  ui: {
    ...chatActions.ui,
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
    chatDialog: 'subtask',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
