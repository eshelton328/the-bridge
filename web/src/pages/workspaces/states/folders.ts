// Figma Workbench D4 (128:46), "D4 · Folders": drift check, a Codex chat in
// omni-brain, fills the middle. The folders control under the prompt box
// shows its working folder and one more, and its list is open over the
// transcript: ~/omni-brain (the working folder), ~/omni with its remove ×,
// and Add folder. The folder picker beside the chat lists the recent
// folders, with ~/the-bridge chosen, and the folders of ~/. The sidebar's
// headers show no count or dot, and the chat header has no ⋯. Starts from
// D2b (chatActions) with D3's sidebar (subagents), which lists no subtask.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'
import { subagents } from './subagents.ts'

export const folders = {
  title: 'Folders',
  frames: [{ id: 'D4', node: '128:46', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    workspaces: subagents.data.workspaces,
    current: 'omni-brain',
    panes: [
      {
        type: 'chat',
        id: 'drift-check',
        head: {
          kind: 'codex',
          title: 'drift check',
          model: 'GPT-5.5',
          context: 23,
          status: { label: 'Needs you', tone: 'needsYou' },
        },
        entries: [
          { type: 'user', text: 'Check the brain and ~/omni for duplicated notes and stale links.' },
          {
            type: 'assistant',
            kind: 'codex',
            name: 'Codex',
            text: 'Found 3 candidate pairs and 1 stale link. The-bridge’s own docs may hold a third copy; add ~/the-bridge and I’ll check it too.',
          },
        ],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '',
          attachments: [],
          model: 'GPT-5.5',
          running: false,
        },
      },
    ],
    sidebar: { ...chatActions.data.sidebar, counts: false },
    chatActions: false,
    folders: {
      label: 'Folders',
      heading: 'FOLDERS',
      scope: 'this chat',
      items: ['~/omni-brain', '~/omni'],
      working: 'working folder',
      remove: 'Remove {folder}',
      add: 'Add folder',
    },
    folderPicker: {
      title: 'Add a folder',
      closeLabel: 'Close the folder picker',
      note: 'Folders on the Mac that runs the-bridge.',
      searchLabel: 'Search folders',
      query: '~/the-',
      recentLabel: 'RECENT',
      recent: [
        { path: '~/omni-brain', added: true },
        { path: '~/omni', added: true },
        { path: '~/the-bridge', added: false },
      ],
      addedLabel: 'added',
      browseLabel: 'BROWSE',
      browsePath: '~/',
      browse: ['Documents', 'omni', 'omni-brain', 'the-bridge'],
      openLabel: 'Open {folder}',
      cancel: 'Cancel',
      add: 'Add {folder}',
    },
    layers: {
      sidebar: '128:146',
      toggle: '158:14',
      newWorkspace: '128:150',
      headers: {
        'omni-brain': '128:154',
        'the-bridge': '128:204',
        omni: '128:238',
        'skill-evals': '128:263',
      },
      rows: {
        'bridge-themes': '128:163',
        'drift-check': '128:177',
        'brain-git': '128:193',
        'hono-server': '128:213',
        'dev-server': '128:227',
        'release-notes': '128:247',
      },
      mainChat: '128:272',
      chatHead: '128:273',
      composer: '137:2',
      entries: ['128:304', '128:306'],
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'drift-check',
    menuFor: null,
    hovered: null,
    sideChatOpen: false,
    foldersOpen: true,
    folderPickerOpen: true,
    pickedFolder: '~/the-bridge',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
