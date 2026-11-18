// Figma Workbench D21 (417:2142), "D21 · Rename chat": Rename chat turns the
// name in the chat header into a field, with the focus in it after the name
// and × at its end. A click outside the field or Enter saves the name; × or
// Escape undoes the change and closes it. bridge themes stays selected and
// shown alone, Working, and the pointer rests on omni's header. Starts from
// D2b (chatActions), without the side chat and the menu.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

export const renameChat = {
  title: 'Rename chat',
  frames: [{ id: 'D21', node: '417:2142', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    layers: {
      sidebar: '417:2184',
      toggle: '417:2187',
      newWorkspace: '417:2192',
      headers: {
        'omni-brain': '417:2196',
        'the-bridge': '417:2270',
        omni: '417:2313',
        'skill-evals': '417:2348',
      },
      rows: {
        'bridge-themes': '417:2214',
        'theme-tokens': '417:2228',
        'drift-check': '417:2243',
        'brain-git': '417:2259',
        'hono-server': '417:2288',
        'dev-server': '417:2302',
        'release-notes': '417:2332',
      },
      mainChat: '417:2365',
      chatHead: '417:2366',
      chatActions: '417:2377',
      composer: '417:2412',
      entries: ['417:2394', undefined, '417:2399'],
      renameField: 'rename field · chat',
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'bridge-themes',
    menuFor: null,
    menuHighlight: null,
    sideChatOpen: false,
    renaming: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
