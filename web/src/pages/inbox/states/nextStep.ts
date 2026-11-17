// Figma Inbox D1 "Inbox, a next step": the next step "Write the tickets
// for increment one" is open. Copy taken word for word from
// references/inbox/D01/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxDetailHead, InboxGroupView, InboxRunIn, InboxUi } from '../types.ts'

const selected = InboxItemId.parse('write-the-tickets')

// The selected next step's prompt and note, which its detail shows and the search matches.
const prompt =
  'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and leave them in Backlog for me to review. Group the tickets under one milestone named Increment 1, and give each a short acceptance list taken from the increment’s acceptance section. Skip screens the requirements mark desktop only when the ticket is for the phone, and list anything you could not map to a requirement at the end, with the reason.'
const note = 'Check the milestone name matches Linear before I approve.'

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
      tags: ['global/decision'],
    },
    {
      id: InboxItemId.parse('pick-the-header-logo'),
      kind: 'review',
      title: 'Pick the header logo',
      meta: 'ncc-1701 · f-005 · NCC-36',
      age: '1h',
      blocks: null,
      approval: false,
      tags: ['global/review', 'project/ncc-1701/design'],
    },
    {
      id: InboxItemId.parse('try-the-tablet-layout'),
      kind: 'action',
      title: 'Try the tablet layout on the iPad mini',
      meta: 'ncc-1701 · f-005',
      age: '3h',
      blocks: null,
      approval: false,
      tags: ['project/ncc-1701/the-bridge'],
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
      tags: ['global/planning', 'project/ncc-1701/the-bridge'],
      text: [prompt, note],
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

const item = (value: string, count: number) => ({ value, label: value, count })

// The Sort and Filter menus (Figma D9 346:3566 and D4 346:1310), which every state's list tools open.
const sortMenu = {
  heading: 'Sort by',
  options: [
    { value: 'newest', label: 'Newest first', description: 'Most recent activity at the top', short: 'Newest' },
    { value: 'oldest', label: 'Oldest first', description: 'Waiting longest at the top', short: 'Oldest' },
    { value: 'project', label: 'Project', description: 'Grouped by project, then newest', short: 'Project' },
    { value: 'kind', label: 'Kind', description: 'Approvals first, next steps last', short: 'Kind' },
  ],
  note: 'Sorting applies inside each group.',
} satisfies InboxData['sortMenu']

const filterMenu = {
  sections: [
    {
      label: 'Kind',
      mono: false,
      items: [
        { value: 'approval', label: 'Approval', count: 1 },
        { value: 'question', label: 'Question', count: 1 },
        { value: 'review', label: 'Review', count: 1 },
        { value: 'action', label: 'Action', count: 1 },
        { value: 'next', label: 'Next step', count: 3 },
      ],
    },
    { label: 'Project', mono: true, items: [item('ncc-1701', 5), item('omni-brain', 1), item('skill-evals', 1)] },
    {
      label: 'Tags · global',
      mono: true,
      items: [item('global/decision', 1), item('global/planning', 1), item('global/review', 1)],
    },
    {
      label: 'Tags · project ncc-1701',
      mono: true,
      items: [item('project/ncc-1701/the-bridge', 2), item('project/ncc-1701/design', 1)],
    },
  ],
} satisfies InboxData['filterMenu']

/** The Filter menu with every kind and project checked and no tag, as Figma T14 draws it before a change: no filter. */
export const noFilter = ['approval', 'question', 'review', 'action', 'next', 'ncc-1701', 'omni-brain', 'skill-evals']

/** The Snooze menu of an open item's task bar (Figma D12 346:4878). */
export const snoozeMenu = {
  heading: 'Snooze',
  times: [
    { value: 'hour', label: 'In 1 hour', time: '11:40' },
    { value: 'evening', label: 'This evening', time: '20:00' },
    { value: 'morning', label: 'Tomorrow morning', time: '9:00' },
  ],
  pick: 'Pick a date and time…',
  done: 'Mark done',
  dismiss: 'Dismiss with a reason…',
} satisfies NonNullable<InboxDetailHead['snoozeMenu']>

// The Run in picker (Figma D3 346:821), which Change opens.
const picker = {
  search: 'Search workspaces and chats',
  sections: [
    {
      label: 'New chat',
      choices: [
        {
          value: 'new-claude',
          agent: 'claude',
          label: 'New Claude Code chat',
          description: 'the-bridge · Sonnet 5.5',
          pill: { tone: 'working', label: 'Recommended', dot: false },
        },
        { value: 'new-codex', agent: 'codex', label: 'New Codex chat', description: 'the-bridge · GPT-5.5' },
        { value: 'new-elsewhere', label: 'New chat in another workspace…' },
      ],
    },
    {
      label: 'Existing chats · the-bridge',
      choices: [
        {
          value: 'hono-server',
          agent: 'claude',
          label: 'hono server',
          description: 'Sonnet 5.5 · 78% context',
          pill: { tone: 'needsYou', label: 'Needs you', dot: true },
        },
      ],
    },
    {
      label: 'Existing chats · omni-brain',
      choices: [
        {
          value: 'bridge-themes',
          agent: 'claude',
          label: 'bridge themes',
          description: 'Opus 5.5 · 42% context',
          pill: { tone: 'working', label: 'Working', dot: true },
        },
        {
          value: 'drift-check',
          agent: 'codex',
          label: 'drift check',
          description: 'GPT-5.5 · 23% context',
          pill: { tone: 'needsYou', label: 'Needs you', dot: true },
        },
      ],
    },
  ],
  selected: 'new-claude',
  note: 'Shells are not listed: a prompt needs Claude Code or Codex.',
} satisfies NonNullable<InboxRunIn['picker']>

export const nextStep = {
  title: 'a next step',
  frames: [{ id: 'D1', node: '346:5', viewport: 'desktop' }],
  data: {
    railBadge: 4,
    count: 7,
    filters: [
      { value: 'all', label: 'All', count: 7 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 3 },
      { value: 'running', label: 'Running', count: 0 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    sortMenu,
    filterMenu,
    groups: [needsYou, nextSteps, snoozed],
    detail: {
      kind: 'next',
      id: selected,
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
      snoozeMenu,
      why: 'Increment one’s screens are drawn and its acceptance is written. Tickets come before any code, and nothing blocks them.',
      prompt: {
        text: prompt,
        long: true,
        state: 'suggested',
      },
      launch: {
        stage: 'suggested',
        runIn: {
          title: 'New Claude Code chat',
          badge: 'Recommended',
          detail: 'the-bridge · Sonnet 5.5 · folders ~/the-bridge',
          picker,
        },
        startLabel: 'Start in the-bridge',
        startHint: 'Opens the new chat and sends the prompt.',
      },
      notes: {
        note: { text: note, by: 'You · 2m ago' },
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
    discussOpen: false,
    removeOpen: false,
    sort: 'newest',
    filterChecks: noFilter,
    filters: noFilter,
    snoozed: [],
    finished: [],
    proposals: {},
    proposalChecks: {},
  },
} satisfies ScreenState<InboxData, InboxUi>
