// Figma Workbench M2 (105:2479), "M2 · Edit workspaces": the phone's list in
// edit mode. Each workspace and each chat has its drag handle, each workspace
// its × in place of its ⋯, and no row has its ⋯; Done takes Edit's place and
// + is off. bridge themes' name is a field with "theme explorations" typed in
// it, and the-bridge's name is a field too. theme tokens is not listed, and
// drift check shows no status, as Figma draws them. Starts from M1
// (phoneHome); at a desktop width it draws M1's desktop layout.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneHome } from './phoneHome.ts'

export const phoneEdit = {
  title: 'Edit workspaces on the phone',
  frames: [{ id: 'M2', node: '105:2479', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    workspaces: phoneHome.data.workspaces.map((w) =>
      w.id === 'omni-brain'
        ? {
            ...w,
            chats: [
              {
                id: 'bridge-themes',
                kind: 'claude',
                title: 'bridge themes',
                model: 'Opus 5.5',
                context: 42,
                status: { label: 'Working', tone: 'working' },
              },
              {
                id: 'drift-check',
                kind: 'codex',
                title: 'drift check',
                model: 'GPT-5.5',
                context: 23,
                status: { label: 'Needs you', tone: 'needsYou' },
                hideStatus: true,
              },
              {
                id: 'brain-git',
                kind: 'shell',
                title: 'brain git',
                model: 'shell · zsh',
                status: { label: 'Idle', tone: 'idle' },
              },
            ],
          }
        : w,
    ),
    phone: { ...phoneHome.data.phone, done: 'Done' },
    layers: {
      phoneList: '105:2504',
      phoneHeader: '105:2505',
      phoneEdit: '105:2508',
      phoneAdd: '105:2510',
      headers: {
        'omni-brain': '105:2516',
        'the-bridge': '105:2604',
        omni: '105:2663',
        'skill-evals': '105:2702',
      },
      rows: {
        'bridge-themes': '105:2535',
        'drift-check': '105:2556',
        'brain-git': '105:2586',
        'hono-server': '105:2624',
        'dev-server': '105:2645',
        'release-notes': '105:2679',
      },
      renameFields: { 'bridge-themes': '146:37', 'the-bridge': '105:2614' },
    },
  },
  ui: {
    ...phoneHome.ui,
    editing: true,
    renamingChats: { 'bridge-themes': 'theme explorations' },
    renamingWorkspaces: { 'the-bridge': 'the-bridge' },
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
