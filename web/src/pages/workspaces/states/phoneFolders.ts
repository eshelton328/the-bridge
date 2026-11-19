// Figma Workbench M8 (128:646), "M8 · Folders": drift check, a Codex chat in
// omni-brain, open on the phone, with D4's folders sheet over it. The header
// has the back button, the kind mark, drift check over omni-brain and Needs
// you, with no ⋯, then GPT-5.5, 23% of the context and "2 folders", which
// opens the sheet. Under it the owner's message. The sheet lists the chat's
// folders: ~/omni-brain (the working folder), ~/omni with its remove ×, and
// Add folder; under them the folder picker: "~/the-" typed in the search,
// which has the focus, the recent folders with ~/the-bridge chosen, the
// folders of ~/, and Add ~/the-bridge. At a desktop width the state draws
// D4's folders list and picker beside the chat alone. Starts from M3
// (phoneChat), with D4's drift check pane, folders and picker (folders).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { folders } from './folders.ts'
import { phoneChat } from './phoneChat.ts'

const [first] = folders.data.panes
// D4's drift check with the owner's message alone, as Figma draws it under the sheet (128:700); the phone's composer has
// no model chip (M3 105:2831).
const driftCheck: WorkbenchPane[] =
  first?.type === 'chat'
    ? [
        {
          ...first,
          entries: first.entries.slice(0, 1),
          composer: {
            placeholder: first.composer.placeholder,
            text: first.composer.text,
            attachments: first.composer.attachments,
            running: first.composer.running,
          },
        },
      ]
    : []

export const phoneFolders = {
  title: "The chat's folders on the phone, with the folder picker",
  frames: [{ id: 'M8', node: '128:646', viewport: 'phone' }],
  data: {
    ...phoneChat.data,
    current: 'omni-brain',
    panes: driftCheck,
    chatActions: false,
    folders: { ...folders.data.folders, chip: '{count} folders' },
    folderPicker: { ...folders.data.folderPicker, browse: ['omni', 'omni-brain', 'the-bridge'] },
    layers: {
      ...phoneChat.data.layers,
      phoneBack: '128:673',
      chatHead: '128:671',
      chatActions: undefined,
      entries: ['128:701'],
      skills: undefined,
      composer: undefined,
      phoneFolders: {
        chip: '128:695',
        rows: ['128:716', '128:722'],
        add: '128:730',
        rule: '128:735',
        pickerTitle: '128:736',
        search: '128:747',
        recent: ['128:754', '128:760', '128:766'],
        browse: ['128:779', '128:786', '128:793'],
        addFolder: '128:802',
      },
    },
  },
  ui: {
    ...phoneChat.ui,
    focusedPane: 'drift-check',
    skillsFor: null,
    skill: null,
    foldersOpen: true,
    folderPickerOpen: true,
    pickedFolder: '~/the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
