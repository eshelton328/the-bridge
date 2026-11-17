// Figma Inbox D1 "Inbox, a next step": the next step "Write the tickets
// for increment one" is open. Copy taken word for word from
// references/inbox/D01/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxGroupView, InboxUi } from '../types.ts'

const selected = InboxItemId.parse('write-the-tickets')

const needsYou = {
  id: 'needsYou',
  label: 'Needs you',
  count: 4,
  dot: 'needsYou',
  rows: [
    {
      id: InboxItemId.parse('drift-check-git-mv'),
      kind: 'approval',
      title: 'drift check wants to run git mv',
      meta: 'omni-brain · drift check',
      age: '4m',
      blocks: 'Codex is waiting',
      approval: true,
    },
    {
      id: InboxItemId.parse('hono-rpc-or-fetch'),
      kind: 'question',
      title: 'Hono RPC client or plain fetch for the API?',
      meta: 'ncc-1701 · f-005 · NCC-31',
      age: '12m',
      blocks: 'Blocks hono server',
      approval: false,
    },
    {
      id: InboxItemId.parse('pick-the-header-logo'),
      kind: 'review',
      title: 'Pick the header logo',
      meta: 'ncc-1701 · f-005 · NCC-36',
      age: '1h',
      blocks: null,
      approval: false,
    },
    {
      id: InboxItemId.parse('try-the-tablet-layout'),
      kind: 'action',
      title: 'Try the tablet layout on the iPad mini',
      meta: 'ncc-1701 · f-005',
      age: '3h',
      blocks: null,
      approval: false,
    },
  ],
} satisfies InboxGroupView

const nextSteps = {
  id: 'nextSteps',
  label: 'Next steps',
  count: 3,
  dot: 'working',
  rows: [
    {
      id: selected,
      kind: 'next',
      title: 'Write the tickets for increment one',
      meta: 'ncc-1701 · f-005 · NCC-28',
      age: '2h',
      blocks: null,
      approval: false,
    },
    {
      id: InboxItemId.parse('readme-cross-family-round'),
      kind: 'next',
      title: 'Run the readme cross-family round x2',
      meta: 'skill-evals · readme',
      age: '5h',
      blocks: null,
      approval: false,
    },
    {
      id: InboxItemId.parse('commit-the-brain'),
      kind: 'next',
      title: 'Commit the brain: 34 changes',
      meta: 'ncc-1701 · brain',
      age: '1d',
      blocks: null,
      approval: false,
    },
  ],
} satisfies InboxGroupView

const snoozed = { id: 'snoozed', label: 'Snoozed', count: 1, dot: null, rows: [] } satisfies InboxGroupView

/** D1's groups, which the other states start from. */
export const nextStepGroups = { needsYou, nextSteps, snoozed }

export const nextStep = {
  title: 'a next step',
  frames: [{ id: 'D1', node: '346:5', viewport: 'desktop' }],
  data: {
    railBadge: 4,
    count: 7,
    countLabel: '7 tasks',
    filters: [
      { value: 'all', label: 'All', count: 7 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 3 },
      { value: 'running', label: 'Running', count: 0 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    sort: 'Newest',
    sortActive: false,
    groups: [needsYou, nextSteps, snoozed],
    detail: {
      kind: 'next',
      status: { tone: 'working', label: 'Next step' },
      origin: 'suggested 2h ago by the planning run',
      title: 'Write the tickets for increment one',
      chips: [
        { label: 'ncc-1701', icon: 'folder', issue: false },
        { label: 'f-005 the-bridge', icon: 'feature', issue: false },
        { label: 'NCC-28', icon: 'linear', issue: true },
      ],
      tags: ['global/planning', 'project/ncc-1701/the-bridge'],
      actions: true,
      why: 'Increment one’s screens are drawn and its acceptance is written. Tickets come before any code, and nothing blocks them.',
      prompt: {
        text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and leave them in Backlog for me to review. Group the tickets under one milestone named Increment 1, and give each a short acceptance list taken from the increment’s acceptance section. Skip screens the requirements mark desktop only when the ticket is for the phone, and list anything you could not map to a requirement at the end, with the reason.',
        edited: false,
        long: true,
        sent: false,
      },
      launch: {
        stage: 'suggested',
        runIn: {
          title: 'New Claude Code chat',
          badge: 'Recommended',
          detail: 'the-bridge · Sonnet 5.5 · folders ~/the-bridge',
        },
        startLabel: 'Start in the-bridge',
        startHint: 'Opens the new chat and sends the prompt.',
      },
      notes: {
        text: 'Check the milestone name matches Linear before I approve.',
        by: 'You · 2m ago',
        add: 'Add a note…',
      },
      sources: [
        { label: 'increment-1.md', detail: 'f-005 the-bridge' },
        { label: 'NCC project', detail: 'Linear' },
      ],
    },
  },
  ui: {
    filter: 'all',
    selectedId: selected,
    groupsOpen: { needsYou: true, nextSteps: true, snoozed: false, running: false, today: false, yesterday: false },
    filterOpen: false,
    editingPrompt: false,
    pickerOpen: false,
    sortOpen: false,
    snoozeOpen: false,
    promptOpen: false,
  },
} satisfies ScreenState<InboxData, InboxUi>
