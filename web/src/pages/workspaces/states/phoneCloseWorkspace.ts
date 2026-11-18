// Figma Workbench M13 (208:534), "M13 · Confirm closing a workspace": × on
// omni-brain in the phone's edit mode asks before the workspace closes. The
// dialog names the workspace and the chats that end with it; Close is red and
// Cancel is the easy target. Behind the scrim the list is in edit mode, with
// no field open, bridge themes and drift check with no status, and theme
// tokens not listed, as Figma draws them. Starts from M2 (phoneEdit), without
// its fields; at a desktop width it draws M1's desktop layout.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneEdit } from './phoneEdit.ts'

export const phoneCloseWorkspace = {
  title: 'Confirm closing a workspace on the phone',
  frames: [{ id: 'M13', node: '208:534', viewport: 'phone' }],
  data: {
    ...phoneEdit.data,
    workspaces: phoneEdit.data.workspaces.map((w) =>
      w.id === 'omni-brain'
        ? { ...w, chats: w.chats.map((c) => (c.id === 'bridge-themes' ? { ...c, hideStatus: true } : c)) }
        : w,
    ),
    phone: {
      ...phoneEdit.data.phone,
      closeWorkspace: {
        cancel: 'Cancel',
        close: 'Close',
        workspaces: {
          'omni-brain': {
            title: 'Close omni-brain?',
            text: 'bridge themes and its subtask, drift check and the brain git shell all end with it. This can’t be undone.',
          },
        },
      },
    },
    layers: {
      phoneList: '208:559',
      phoneHeader: '208:560',
      phoneEdit: '208:563',
      phoneAdd: '208:565',
      headers: {
        'omni-brain': '208:569',
        'the-bridge': '208:648',
        omni: '208:704',
        'skill-evals': '208:743',
      },
      rows: {
        'bridge-themes': '208:586',
        'drift-check': '208:610',
        'brain-git': '208:630',
        'hono-server': '208:665',
        'dev-server': '208:686',
        'release-notes': '208:720',
      },
      closeDialog: { dialog: '208:765', cancel: '208:769', close: '208:771' },
    },
  },
  ui: {
    ...phoneEdit.ui,
    renamingChats: {},
    renamingWorkspaces: {},
    closing: 'omni-brain',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
