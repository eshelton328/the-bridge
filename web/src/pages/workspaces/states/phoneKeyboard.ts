// Figma Workbench M10 (147:21), "M10 · Chat, keyboard open": bridge themes
// on the phone while Erik types. The keyboard is up, so the header is one
// line: the back button, the kind mark, the title over "Opus 5.5 · 42% · 2
// folders", Working and the ⋯. Under it Erik's message and Claude's reply,
// with no Copy; Erik has typed "Turn the layout notes into a doc with /wri",
// so the skills that match "/wri", /writer alone, are listed over the
// composer, and Stop shows while the chat works. The keyboard itself is the
// phone's (d-089). At a desktop width the state draws M1's sidebar with
// bridge themes alone and its skills open. Starts from M3 (phoneChat), with
// D4's two folders (folders) and M8's folders chip.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ChatEntry, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { folders } from './folders.ts'
import { phoneChat } from './phoneChat.ts'

const [first] = phoneChat.data.panes
// M3's pane with Erik's message and Claude's reply alone (147:63), the reply without Copy, and the message typed with
// no attachment (147:79).
const bridgeThemes: WorkbenchPane[] =
  first?.type === 'chat'
    ? [
        {
          ...first,
          entries: first.entries.flatMap((entry): ChatEntry[] => {
            if (entry.type === 'user') return [entry]
            if (entry.type === 'assistant')
              return [{ type: 'assistant', kind: entry.kind, name: entry.name, text: entry.text }]
            return []
          }),
          composer: { ...first.composer, text: 'Turn the layout notes into a doc with /wri', attachments: [] },
        },
      ]
    : []

export const phoneKeyboard = {
  title: 'A chat on the phone with the keyboard open',
  frames: [{ id: 'M10', node: '147:21', viewport: 'phone' }],
  data: {
    ...phoneChat.data,
    panes: bridgeThemes,
    skillsMatching: 'SKILLS MATCHING {query}',
    folders: { ...folders.data.folders, chip: '{count} folders' },
    layers: {
      ...phoneChat.data.layers,
      phoneBack: '147:47',
      chatHead: '147:46',
      chatActions: '147:58',
      entries: ['148:84', '147:64'],
      skills: '147:70',
      composer: '147:79',
    },
  },
  ui: { ...phoneChat.ui, keyboardOpen: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
