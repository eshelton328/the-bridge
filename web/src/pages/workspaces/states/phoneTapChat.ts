// Figma Workbench M16 (402:10497), "M16 · Tap a chat to open it": M1's list
// at the moment Erik taps bridge themes. The tap opens the chat full screen
// (M3); the phone has no drag and no split panes. Figma marks the finger with
// a ring over the row (`tap`, 402:10747), a note for the reader that the app
// does not draw. At a desktop width the state draws M1's sidebar with bridge
// themes alone.
// Starts from M1 (phoneHome), with M3's back label and M16's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChat } from './phoneChat.ts'
import { phoneHome } from './phoneHome.ts'

export const phoneTapChat = {
  title: 'A tap on a chat in the phone list, which opens it',
  frames: [{ id: 'M16', node: '402:10497', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    phone: { ...phoneHome.data.phone, back: phoneChat.data.phone.back },
    layers: {
      ...phoneHome.data.layers,
      phoneList: '402:10522',
      phoneHeader: '402:10523',
      phoneEdit: '402:10526',
      phoneAdd: '402:10528',
      headers: {
        'omni-brain': '402:10532',
        'the-bridge': '402:10619',
        omni: '402:10665',
        'skill-evals': '402:10696',
      },
      rows: {
        'bridge-themes': '402:10543',
        'theme-tokens': '402:10562',
        'drift-check': '402:10582',
        'brain-git': '402:10603',
        'hono-server': '402:10630',
        'dev-server': '402:10649',
        'release-notes': '402:10675',
      },
      rowMenus: {
        'bridge-themes': '402:10557',
        'theme-tokens': '402:10577',
        'drift-check': '402:10598',
        'brain-git': '402:10614',
        'hono-server': '402:10644',
        'dev-server': '402:10660',
        'release-notes': '402:10691',
      },
    },
  },
  ui: { ...phoneHome.ui },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
