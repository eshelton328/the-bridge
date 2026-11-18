// Figma Workbench T5 (128:432), "T5 · Folders": bridge themes' folders on the
// iPad mini, a sheet that "2 folders" in the chat's header opens. The chat
// fills the screen as on the phone, with no tab bar: the header with the back
// button, the title over omni-brain, Working and the ⋯, then Opus 5.5, the
// context used, "context" and the chip; Erik's message and Claude's reply,
// with no read line and no Copy. The sheet is titled Folders with the chat's
// name after it and ×, then D4's folders: ~/omni-brain (the working folder),
// ~/omni with its remove ×, and Add folder; under a rule the folder picker:
// "~/the-" typed in the search, which has the focus, the recent folders with
// ~/the-bridge chosen, the folders of ~/ (Documents, omni, omni-brain,
// the-bridge), then Cancel and Add ~/the-bridge at the sheet's end. Starts
// from T2b (tabletChatActions), without the menu, with M8's folders sheet
// (phoneFolders) and D4's picker (folders); at a desktop width it draws M1's
// sidebar with bridge themes alone and D4's folders list and picker beside it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ChatEntry, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { folders } from './folders.ts'
import { phoneFolders } from './phoneFolders.ts'
import { tabletChatActions } from './tabletChatActions.ts'

// T5 128:527: Erik's message and Claude's reply, with no read line and no Copy.
function t5Entries(entries: readonly ChatEntry[]): ChatEntry[] {
  return entries.flatMap((e): ChatEntry[] => {
    if (e.type === 'user') return [e]
    if (e.type === 'assistant') {
      const text = 'Three directions: a tiled home, a star map of agents, and a split-pane workbench.'
      return [{ type: 'assistant', kind: e.kind, name: e.name, text }]
    }
    return []
  })
}

const bridgeThemes: WorkbenchPane[] = tabletChatActions.data.panes.map((p) =>
  p.type === 'chat' ? { ...p, entries: t5Entries(p.entries) } : p,
)

export const tabletFolders = {
  title: "The chat's folders on the tablet, in a sheet with the folder picker",
  frames: [{ id: 'T5', node: '128:432', viewport: 'tablet' }],
  data: {
    ...tabletChatActions.data,
    panes: bridgeThemes,
    chatMenu: undefined,
    folders: phoneFolders.data.folders,
    // D4's picker: T5 lists Documents with the other folders of ~/ (128:605).
    folderPicker: folders.data.folderPicker,
    layers: {
      ...tabletChatActions.data.layers,
      phoneBack: '128:495',
      chatHead: '128:493',
      chatActions: '128:506',
      chatMenu: undefined,
      entries: ['128:528', '128:530'],
      composer: undefined,
      phoneFolders: {
        chip: '128:520',
        title: '128:540',
        rows: ['128:549', '128:555'],
        add: '128:563',
        rule: '128:568',
        pickerTitle: '128:569',
        search: '128:580',
        recent: ['128:587', '128:593', '128:599'],
        browse: ['128:605', '128:612', '128:619', '128:626'],
        addFolder: '128:638',
        cancel: '128:636',
      },
    },
  },
  ui: {
    ...tabletChatActions.ui,
    menuFor: null,
    menuHighlight: null,
    foldersOpen: true,
    folderPickerOpen: true,
    pickedFolder: '~/the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
