// Figma Workbench M7 (105:3248), "M7 · New chat": the New chat form on the
// phone, which fills the screen with no tab bar. Cancel and the title at the
// top; the name, blank for the random quiet-nebula; Runs in with Claude Code
// chosen over Codex and shell; the-bridge as the workspace; ~/the-bridge and
// ~/omni as the folders, with Add folder; Sonnet 5.5 at high effort; the
// first message, empty, with the focus. At the bottom the summary, "Runs in
// the-bridge · Sonnet 5.5 · 2 folders", over Start chat. At a desktop width
// the state draws M1's sidebar with bridge themes alone and D3's New chat
// dialog over it. Starts from M1 (phoneHome), with D3's New chat form
// (subagents).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneHome } from './phoneHome.ts'
import { subagents } from './subagents.ts'

const form = subagents.data.newChat

export const phoneNewChat = {
  title: 'New chat on the phone',
  frames: [{ id: 'M7', node: '105:3248', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    newChat: {
      ...form,
      model: {
        ...form.model,
        options: [
          { value: 'sonnet-high', label: 'Sonnet 5.5 · high effort', short: 'Sonnet 5.5' },
          { value: 'opus-high', label: 'Opus 5.5 · high effort', short: 'Opus 5.5' },
        ],
      },
      summary: 'Runs in {workspace} · {model} · {folders} folders',
    },
    layers: {
      ...phoneHome.data.layers,
      newChatForm: {
        header: '105:3273',
        cancel: '105:3274',
        title: '105:3276',
        fields: {
          name: '114:11',
          runsIn: '105:3304',
          workspace: '105:3314',
          folders: '128:24',
          model: '105:3322',
          message: '105:3338',
        },
        boxes: { name: '114:16', workspace: '105:3309', model: '105:3317', message: '105:3327' },
        runsIn: { claude: '105:3284', codex: '105:3291', shell: '105:3298' },
        folders: ['128:30', '128:34'],
        addFolder: '128:41',
        startBar: '147:8',
        summary: '147:9',
        start: '147:10',
      },
    },
  },
  ui: {
    ...phoneHome.ui,
    newChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
