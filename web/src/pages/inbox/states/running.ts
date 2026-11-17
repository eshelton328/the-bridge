// Figma Inbox D5 "Started, the chat stays in the inbox": the next step
// runs in a new chat; its row moved to the Running group and the detail
// shows the chat with a reply box. Copy word for word from
// references/inbox/D05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep, nextStepGroups } from './nextStep.ts'

const { needsYou, nextSteps, snoozed } = nextStepGroups
const started = nextStep.ui.selectedId
const waiting = nextSteps.rows.filter((row) => row.id !== started)

export const running = {
  title: 'started, the chat stays in the inbox',
  frames: [{ id: 'D5', node: '346:1909', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    filters: [
      { value: 'all', label: 'All', count: 7 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 2 },
      { value: 'running', label: 'Running', count: 1 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    groups: [
      needsYou,
      { ...nextSteps, count: 2, rows: waiting },
      snoozed,
      {
        id: 'running',
        label: 'Running',
        count: 1,
        dot: 'working',
        rows: nextSteps.rows
          .filter((row) => row.id === started)
          .map((row) => ({
            ...row,
            running: {
              agent: 'claude',
              line: 'quiet-nebula · Creating 9 issues…',
              status: { tone: 'working', label: 'Working', dot: true },
            },
          })),
      },
    ],
    detail: {
      kind: 'running',
      id: nextStep.data.detail.id,
      title: 'Write the tickets for increment one',
      agent: 'claude',
      meta: {
        task: 'ncc-1701 · f-005 · NCC-28',
        started: 'started 3 min ago in',
        chat: 'quiet-nebula · the-bridge · Sonnet 5.5',
      },
      status: { tone: 'working', label: 'Working', dot: true },
      chat: [
        {
          type: 'user',
          text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and leave them in Backlog for me to review…',
        },
        { type: 'tool', name: 'Read', target: 'increment-1.md, linear.md', state: 'done' },
        {
          type: 'assistant',
          agent: 'claude',
          name: 'Claude',
          text: 'Increment one has nine screens. The inbox screens are newer than the increment. Should they join this cycle, or wait for increment two?',
        },
        { type: 'user', text: 'Wait for increment two.' },
        { type: 'tool', name: 'Creating', target: '9 issues in NCC…', state: 'running' },
      ],
      reply: 'Reply to quiet-nebula',
      model: 'Sonnet 5.5',
    },
  },
  ui: { ...nextStep.ui, groupsOpen: { ...nextStep.ui.groupsOpen, running: true } },
} satisfies ScreenState<InboxData, InboxUi>
