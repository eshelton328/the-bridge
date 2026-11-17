// Figma Inbox D7 "Done": finished tasks by day, each with how it ended.
// The finished next step is open, read-only, with Open chat, which opens
// its chat in quiet-nebula: the one Start opened, with its last tool line
// done (no frame draws the finished chat). Copy word for word from
// references/inbox/D07/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxPill, InboxUi } from '../types.ts'
import { nextStep, startedChat } from './nextStep.ts'
import { runningTask } from './runningTask.ts'

const base = runningTask.data.detail
const selected = nextStep.ui.selectedId
const finishedPill: InboxPill = { tone: 'done', label: 'Done', dot: true }

export const done = {
  title: 'done',
  frames: [{ id: 'D7', node: '346:2735', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    groups: [
      {
        id: 'today',
        label: 'Today',
        count: 2,
        dot: null,
        rows: [
          {
            id: selected,
            kind: 'next',
            title: 'Write the tickets for increment one',
            meta: 'ncc-1701 · f-005 · NCC-28',
            age: '14:02',
            blocks: null,
            approval: false,
            outcome: { line: 'Finished in quiet-nebula · 9 issues created', result: 'done' },
          },
          {
            id: InboxItemId.parse('drift-check-git-mv'),
            kind: 'approval',
            title: 'drift check wants to run git mv',
            meta: 'omni-brain · drift check',
            age: '11:20',
            blocks: null,
            approval: false,
            outcome: { line: 'Allowed once', result: 'done' },
          },
        ],
      },
      {
        id: 'yesterday',
        label: 'Yesterday',
        count: 2,
        dot: null,
        rows: [
          {
            id: InboxItemId.parse('pick-the-header-logo'),
            kind: 'review',
            title: 'Pick the header logo',
            meta: 'ncc-1701 · f-005 · NCC-36',
            age: 'Fri',
            blocks: null,
            approval: false,
            outcome: { line: 'Answered: A · Span, for now', result: 'done' },
          },
          {
            id: InboxItemId.parse('rename-spok'),
            kind: 'next',
            title: 'Rename spok to cpt-log everywhere',
            meta: 'ncc-1701 · brain',
            age: 'Fri',
            blocks: null,
            approval: false,
            outcome: { line: 'Dismissed: already done by hand', result: 'dismissed' },
          },
        ],
      },
    ],
    detail: {
      ...base,
      status: { tone: 'done', label: 'Done' },
      origin: 'finished today at 14:02',
      actions: false,
      launch: {
        stage: 'started',
        run: {
          agent: 'claude',
          title: 'Finished in quiet-nebula',
          status: finishedPill,
          meta: 'the-bridge · Sonnet 5.5 · 9 issues created in NCC, milestone Increment one',
          open: 'Open chat',
          openElsewhere: 'Open in Workspaces',
          chat: {
            ...startedChat,
            status: finishedPill,
            chat: startedChat.chat.map((entry) => (entry.type === 'tool' ? { ...entry, state: 'done' } : entry)),
          },
        },
      },
    },
  },
  ui: {
    ...runningTask.ui,
    filter: 'done',
    groupsOpen: { ...runningTask.ui.groupsOpen, today: true, yesterday: true },
  },
} satisfies ScreenState<InboxData, InboxUi>
