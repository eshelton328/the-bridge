// Figma Workbench D3 (105:983), "Subagents and new chat": hono server, in
// the-bridge, fills the middle and waits for an approval; the subagents
// panel beside it lists Map requirements (done), Layout notes (running,
// its transcript open) and the theme tokens subtask, each with Stop while it
// runs. The New chat form is open over the screen. The sidebar lists no
// subtask, and no header is hovered or dragged onto. Starts from D2b
// (chatActions), the nearest state.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { chatActions } from './chatActions.ts'

const workspaces = chatActions.data.workspaces.map((w) => ({
  ...w,
  chats: w.chats.filter((c) => c.id !== 'theme-tokens'),
}))

export const subagents = {
  title: 'Subagents and new chat',
  frames: [{ id: 'D3', node: '105:983', viewport: 'desktop' }],
  data: {
    ...chatActions.data,
    workspaces,
    current: 'the-bridge',
    panes: [
      {
        type: 'chat',
        id: 'hono-server',
        head: {
          kind: 'claude',
          title: 'hono server',
          model: 'Sonnet 5.5',
          context: 78,
          status: { label: 'Needs you', tone: 'needsYou' },
        },
        entries: [
          { type: 'user', text: 'Move the API routes from omni into the-bridge, on Hono.' },
          {
            type: 'assistant',
            kind: 'claude',
            name: 'Claude',
            text: 'I started a subtask for the theme tokens while I set up the server. Hono needs its Node adapter, so I need to install two packages.',
          },
          {
            type: 'approval',
            label: 'APPROVAL NEEDED',
            title: 'Claude wants to run a command',
            command: 'pnpm add hono @hono/node-server',
            actions: ['Allow once', 'Always allow', 'Deny'],
          },
        ],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '',
          attachments: [],
          model: 'Opus 5.5',
          running: false,
        },
      },
    ],
    subagents: {
      title: 'Subagents',
      closeLabel: 'Close subagents',
      showTranscript: 'Transcript',
      hideTranscript: 'Hide transcript',
      stop: 'Stop',
      items: [
        {
          id: 'map-requirements',
          title: 'Map requirements',
          status: { label: 'Done', tone: 'done' },
          meta: 'Explore agent · 0:41 · 18k tokens',
          transcript: [],
        },
        {
          id: 'layout-notes',
          title: 'Layout notes',
          status: { label: 'Running', tone: 'running' },
          meta: 'writer agent · 0:34 · 11k tokens',
          transcript: [
            '› Read captures/the-bridge-requirements.md',
            '› Read f-005-the-bridge/pages.md',
            '› Writing layout-notes.md',
          ],
        },
        {
          id: 'theme-tokens',
          title: 'Subtask: theme tokens',
          status: { label: 'Running', tone: 'running' },
          meta: 'subtask · full chat context · 1:12 · 26k tokens',
          description: 'Started from this chat with its full context; returns its result here.',
          transcript: [],
        },
      ],
    },
    newChat: {
      title: 'New chat',
      labels: {
        name: 'NAME · OPTIONAL',
        runsIn: 'RUNS IN',
        workspace: 'WORKSPACE',
        folders: 'FOLDERS',
        model: 'MODEL',
        message: 'FIRST MESSAGE',
      },
      name: { placeholder: 'quiet-nebula', hint: 'random if blank' },
      runsIn: {
        options: [
          { kind: 'claude', label: 'Claude Code' },
          { kind: 'codex', label: 'Codex' },
          { kind: 'shell', label: 'shell' },
        ],
        value: 'claude',
      },
      workspace: 'the-bridge',
      folders: ['~/the-bridge', '~/omni'],
      addFolder: 'Add folder',
      model: {
        options: [
          { value: 'sonnet-high', label: 'Sonnet 5.5 · high effort' },
          { value: 'opus-high', label: 'Opus 5.5 · high effort' },
        ],
        value: 'sonnet-high',
      },
      message: { placeholder: 'What should it do? Type / for a skill.', skills: 'Pick a skill' },
      cancel: 'Cancel',
      start: 'Start chat',
    },
    layers: {
      sidebar: '105:1083',
      toggle: '158:10',
      newWorkspace: '105:1087',
      headers: {
        'omni-brain': '105:1091',
        'the-bridge': '105:1143',
        omni: '105:1179',
        'skill-evals': '105:1205',
      },
      rows: {
        'bridge-themes': '105:1102',
        'drift-check': '105:1116',
        'brain-git': '105:1132',
        'hono-server': '105:1154',
        'dev-server': '105:1168',
        'release-notes': '105:1189',
      },
      mainChat: '105:1215',
      chatHead: '105:1216',
      chatActions: '401:2',
      composer: '105:1296',
      entries: ['105:1275', '105:1277', '105:1283'],
      subagents: '105:1312',
      subagentCards: {
        'map-requirements': '105:1322',
        'layout-notes': '105:1335',
        'theme-tokens': '105:1358',
      },
    },
  },
  ui: {
    ...chatActions.ui,
    focusedPane: 'hono-server',
    menuFor: null,
    hovered: null,
    sideChatOpen: false,
    subagentsOpen: true,
    transcripts: ['layout-notes'],
    newChatOpen: true,
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
