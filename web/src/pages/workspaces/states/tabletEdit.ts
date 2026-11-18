// Figma Workbench T1 (105:1456), "T1 · Workspaces (edit mode)": the list in
// edit mode on the iPad mini, which draws the phone's list at the tablet's
// width with the phone's five tabs, centred. Each workspace and each chat has
// its drag handle, each workspace its ×; Done takes Edit's place and + is off.
// the-bridge's name is a field with the caret at its end. drift check shows
// Move to… in place of its status, which opens its actions with Move to
// workspace's list open; theme tokens is not listed. Starts from M2
// (phoneEdit), with bridge themes' name no field, and M9's chat actions
// (phoneHoldChat); at a desktop width it draws M1's desktop layout.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneEdit } from './phoneEdit.ts'
import { phoneHoldChat } from './phoneHoldChat.ts'

export const tabletEdit = {
  title: 'Edit workspaces on the tablet',
  frames: [{ id: 'T1', node: '105:1456', viewport: 'tablet' }],
  data: {
    ...phoneEdit.data,
    tabletList: true,
    phone: {
      ...phoneEdit.data.phone,
      rowMenu: phoneHoldChat.data.phone.rowMenu,
      moveTo: { label: 'Move to…', chats: ['drift-check'] },
    },
    layers: {
      phoneList: '105:1517',
      phoneHeader: '105:1518',
      phoneEdit: '105:1523',
      phoneAdd: '105:1525',
      headers: {
        'omni-brain': '105:1531',
        'the-bridge': '105:1622',
        omni: '105:1681',
        'skill-evals': '105:1720',
      },
      rows: {
        'bridge-themes': '105:1550',
        'drift-check': '105:1574',
        'brain-git': '105:1604',
        'hono-server': '105:1642',
        'dev-server': '105:1663',
        'release-notes': '105:1697',
      },
      renameFields: { 'the-bridge': '105:1632' },
      rowMoves: { 'drift-check': '105:1594' },
    },
  },
  ui: {
    ...phoneEdit.ui,
    renamingChats: {},
    renamingWorkspaces: { 'the-bridge': 'the-bridge' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
