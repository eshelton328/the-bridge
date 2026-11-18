// Figma Workbench M14 (208:2), "M14 · Workspace actions": the ⋯ of omni-brain's
// header in the phone's list opens a sheet titled omni-brain with the
// workspace's actions, not a chat's: New chat in omni-brain, Rename workspace
// and Close workspace, the last in red. Close asks first with M13's dialog.
// The list under the scrim is M1's, bridge themes still selected. At a
// desktop width the state draws M1's sidebar with bridge themes alone.
// Starts from M1 (phoneHome), with M2's Done (Rename opens the name's field
// in edit mode) and M13's close dialog text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneCloseWorkspace } from './phoneCloseWorkspace.ts'
import { phoneHome } from './phoneHome.ts'

export const phoneWorkspaceActions = {
  title: 'A workspace’s actions in a sheet over the phone list',
  frames: [{ id: 'M14', node: '208:2', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    phone: {
      ...phoneHome.data.phone,
      done: 'Done',
      closeWorkspace: phoneCloseWorkspace.data.phone.closeWorkspace,
      workspaceMenu: [
        { value: 'newChat', label: 'New chat in {workspace}' },
        { value: 'rename', label: 'Rename workspace' },
        { value: 'close', label: 'Close workspace' },
      ],
    },
    layers: {
      ...phoneHome.data.layers,
      phoneList: '208:27',
      phoneHeader: '208:28',
      phoneEdit: '208:31',
      phoneAdd: '208:33',
      headers: {
        'omni-brain': '208:37',
        'the-bridge': '208:124',
        omni: '208:170',
        'skill-evals': '208:201',
      },
      rows: {
        'bridge-themes': '208:48',
        'theme-tokens': '208:67',
        'drift-check': '208:87',
        'brain-git': '208:108',
        'hono-server': '208:135',
        'dev-server': '208:154',
        'release-notes': '208:180',
      },
      rowMenus: {
        'bridge-themes': '208:62',
        'theme-tokens': '208:82',
        'drift-check': '208:103',
        'brain-git': '208:119',
        'hono-server': '208:149',
        'dev-server': '208:165',
        'release-notes': '208:196',
      },
      sheetIcons: { newChat: '208:298', rename: '208:240', close: '208:290' },
    },
  },
  ui: {
    ...phoneHome.ui,
    workspaceMenuFor: 'omni-brain',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
