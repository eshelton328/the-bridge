// Figma Workbench D1 (105:5): the omni-brain workspace in four panes. The
// bridge themes chat is focused, works, lists the skills after "/" and has
// its menu open on Move to workspace; drift check waits for an approval,
// brain git is an idle shell and the fourth pane is empty. The other states
// of the page start from this one.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'

export const workbench = {
  title: 'Four panes, a pane menu and the skills open',
  frames: [{ id: 'D1', node: '105:5', viewport: 'desktop' }],
  data: {
    railBadge: 3,
    workspaces: [
      { id: 'omni-brain', label: 'omni-brain', count: 3, needsYou: true },
      { id: 'the-bridge', label: 'the-bridge', count: 2, needsYou: true },
      { id: 'omni', label: 'omni', count: 1, needsYou: false },
      { id: 'skill-evals', label: 'skill-evals', count: 1, needsYou: false },
    ],
    current: 'omni-brain',
    panes: [
      {
        type: 'chat',
        id: 'bridge-themes',
        head: {
          kind: 'claude',
          title: 'bridge themes',
          model: 'Opus 5.5',
          context: 42,
          status: { label: 'Working', tone: 'working' },
        },
        entries: [
          { type: 'user', text: 'Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.' },
          { type: 'tool', name: 'Read', target: 'f-005-the-bridge/requirements.md' },
          {
            type: 'assistant',
            kind: 'claude',
            name: 'Claude',
            text: 'Three directions: a tiled home, a star map of agents, and a split-pane workbench. The workbench suits long sessions on the desktop.',
            copy: 'Copy',
          },
        ],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '/',
          attachments: ['requirements.md'],
          model: 'Opus 5.5',
          running: true,
        },
      },
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
          {
            type: 'progress',
            lines: ['› scanning notes/ and projects/ for duplicates', '  3 candidate pairs, 1 stale link'],
          },
          {
            type: 'approval',
            label: 'APPROVAL NEEDED',
            title: 'Codex wants to run a command',
            command: 'git mv notes/research/old.md archive/',
            actions: ['Allow once', 'Always allow', 'Deny'],
          },
        ],
        composer: { placeholder: 'Reply to Codex', text: '', attachments: [], running: false },
      },
      {
        type: 'empty',
        id: 'empty',
        title: 'Empty pane',
        text: 'Start a chat here, or open one from this workspace.',
        start: [
          { kind: 'claude', label: 'Claude Code' },
          { kind: 'codex', label: 'Codex' },
          { kind: 'shell', label: 'shell' },
        ],
        openLabel: 'OPEN IN THIS PANE',
        open: [
          {
            kind: 'claude',
            title: 'hono server',
            model: 'Sonnet 5.5',
            context: 78,
            status: { label: 'Needs you', tone: 'needsYou' },
          },
          {
            kind: 'claude',
            title: 'cross-family x2',
            model: 'Opus 5.5',
            context: 64,
            status: { label: 'Working', tone: 'working' },
          },
        ],
      },
      {
        type: 'shell',
        id: 'brain-git',
        head: { kind: 'shell', title: 'brain git', model: 'shell · zsh', status: { label: 'Idle', tone: 'idle' } },
        lines: [
          { text: '$ git status --short', tone: 'plain' },
          { text: ' M AGENTS.md', tone: 'modified' },
          { text: ' M projects/ncc-1701/captures/README.md', tone: 'modified' },
          { text: ' D projects/omni/ROADMAP.md', tone: 'deleted' },
          { text: '?? notes/default-frontend-stack.md', tone: 'untracked' },
          { text: '?? toolkit/rules/diagrams.md', tone: 'untracked' },
        ],
        prompt: '$',
      },
    ],
    status: {
      summary: 'omni-brain · 4 panes',
      hints: ['Cmd+1–4 focus a pane', 'Cmd+D split', 'Cmd+W close pane', 'drag a pane header to rearrange'],
      alert: 'the-bridge › hono server needs you',
    },
    paneMenu: [
      { value: 'fork', label: 'Fork' },
      { value: 'sideChat', label: 'Side chat (/btw)' },
      { value: 'subtask', label: 'Subtask' },
      { value: 'move', label: 'Move to workspace' },
      { value: 'rename', label: 'Rename chat' },
      { value: 'close', label: 'Close pane' },
    ],
    // Each workspace's most recent chat, which its tab opens alone in one pane until it has a layout (R6). Figma
    // draws only omni-brain's panes, so these are mock chats with the sidebar's titles (D2).
    lastChats: {
      'omni-brain': {
        type: 'chat',
        id: 'bridge-themes',
        head: {
          kind: 'claude',
          title: 'bridge themes',
          model: 'Opus 5.5',
          context: 42,
          status: { label: 'Working', tone: 'working' },
        },
        entries: [{ type: 'user', text: 'Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.' }],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '',
          attachments: [],
          model: 'Opus 5.5',
          running: true,
        },
      },
      'the-bridge': {
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
          { type: 'user', text: 'Add a Hono server that serves the mock states.' },
          {
            type: 'approval',
            label: 'APPROVAL NEEDED',
            title: 'Claude wants to run a command',
            command: 'pnpm add hono',
            actions: ['Allow once', 'Always allow', 'Deny'],
          },
        ],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '',
          attachments: [],
          model: 'Sonnet 5.5',
          running: false,
        },
      },
      omni: {
        type: 'chat',
        id: 'release-notes',
        head: {
          kind: 'codex',
          title: 'release notes',
          model: 'GPT-5.5',
          context: 18,
          status: { label: 'Done', tone: 'done' },
        },
        entries: [
          { type: 'user', text: 'Draft the release notes for the next omni release.' },
          {
            type: 'assistant',
            kind: 'codex',
            name: 'Codex',
            text: 'The draft is in RELEASE_NOTES.md: two features, three fixes and one breaking change.',
          },
        ],
        composer: { placeholder: 'Reply to Codex', text: '', attachments: [], running: false },
      },
      'skill-evals': {
        type: 'chat',
        id: 'eval-round',
        head: {
          kind: 'claude',
          title: 'eval round',
          model: 'Opus 5.5',
          context: 31,
          status: { label: 'Idle', tone: 'idle' },
        },
        entries: [{ type: 'user', text: 'Run the next eval round for the writer skill.' }],
        composer: {
          placeholder: 'Message, or / for a skill',
          text: '',
          attachments: [],
          model: 'Opus 5.5',
          running: false,
        },
      },
    },
    newWorkspace: 'New workspace…',
    skillsLabel: 'SKILLS',
    skills: [
      { name: '/writer', description: 'Draft a doc from sources' },
      { name: '/readme', description: 'Write or check a README' },
      { name: '/pr-description', description: 'Write a PR description' },
    ],
  },
  ui: {
    focusedPane: 'bridge-themes',
    menuFor: 'bridge-themes',
    moveOpen: true,
    moveTarget: 'the-bridge',
    menuHighlight: 'move',
    skillsFor: 'bridge-themes',
    skill: '/writer',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
