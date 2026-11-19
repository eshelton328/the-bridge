// Figma Workbench M11 (147:174), "M11 · New chat, keyboard open": the New
// chat form on the phone while the owner types its name. "theme tokens" is in the
// name field, which has the focus, so the hint is gone; Runs in with Claude
// Code chosen over Codex; omni-brain as the workspace; the folders as one
// box, "~/omni-brain  +1". The keyboard is up, so the start bar keeps Start
// chat alone, just over it, and the model and the first message are a scroll
// away. The keyboard itself is the phone's (d-089). At a desktop width the
// state draws M1's sidebar with bridge themes alone and D3's New chat dialog
// over it. Starts from M7 (phoneNewChat).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneNewChat } from './phoneNewChat.ts'

const form = phoneNewChat.data.newChat

export const phoneNewChatKeyboard = {
  title: 'New chat on the phone with the keyboard open',
  frames: [{ id: 'M11', node: '147:174', viewport: 'phone' }],
  data: {
    ...phoneNewChat.data,
    newChat: {
      ...form,
      name: { ...form.name, value: 'theme tokens' },
      focus: 'name',
      runsIn: { ...form.runsIn, options: form.runsIn.options.filter((o) => o.kind !== 'shell') },
      workspace: 'omni-brain',
      folders: ['~/omni-brain', '~/the-bridge'],
      foldersBox: '{first}  +{more}',
    },
    layers: {
      ...phoneNewChat.data.layers,
      newChatForm: {
        header: '147:199',
        cancel: '147:200',
        title: '147:202',
        fields: { name: '147:206', runsIn: '147:214', workspace: '148:76', folders: '148:80' },
        boxes: { name: '147:211', workspace: '148:78', folders: '148:82' },
        runsIn: { claude: '147:216', codex: '147:223' },
        folders: [],
        startBar: '147:230',
        start: '147:231',
      },
    },
  },
  ui: { ...phoneNewChat.ui, keyboardOpen: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
