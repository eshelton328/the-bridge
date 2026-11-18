// Figma Workbench M15 (208:301), "M15 · New menu": + at the top of the
// phone's list opens a short menu under it, New chat and New workspace. New
// chat opens New chat (M7) with the current workspace chosen; New workspace
// adds one and opens its name as a field in edit mode (M2). The list under
// the menu is M1's, bridge themes still selected. At a desktop width the
// state draws M1's sidebar with bridge themes alone.
// Starts from M1 (phoneHome), with M2's Done and M7's New chat form.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneHome } from './phoneHome.ts'
import { phoneNewChat } from './phoneNewChat.ts'

export const phoneAddMenu = {
  title: 'The menu that + opens over the phone list',
  frames: [{ id: 'M15', node: '208:301', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    newChat: phoneNewChat.data.newChat,
    phone: {
      ...phoneHome.data.phone,
      done: 'Done',
      addMenu: { newChat: 'New chat', newWorkspace: 'New workspace', untitled: 'new workspace' },
    },
    layers: {
      ...phoneHome.data.layers,
      phoneList: '208:326',
      phoneHeader: '208:327',
      phoneEdit: '208:330',
      phoneAdd: '208:332',
      headers: {
        'omni-brain': '208:336',
        'the-bridge': '208:423',
        omni: '208:469',
        'skill-evals': '208:500',
      },
      rows: {
        'bridge-themes': '208:347',
        'theme-tokens': '208:366',
        'drift-check': '208:386',
        'brain-git': '208:407',
        'hono-server': '208:434',
        'dev-server': '208:453',
        'release-notes': '208:479',
      },
      rowMenus: {
        'bridge-themes': '208:361',
        'theme-tokens': '208:381',
        'drift-check': '208:402',
        'brain-git': '208:418',
        'hono-server': '208:448',
        'dev-server': '208:464',
        'release-notes': '208:495',
      },
      addMenu: { menu: '208:515', icons: { newChat: '208:521', newWorkspace: '208:529' } },
    },
  },
  ui: {
    ...phoneHome.ui,
    addMenuOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
