// Figma Inbox D18 "The new tasks in the inbox": the discussion is closed
// and the list is back. The three new tasks sit under Next steps with a
// New pill, and a toast offers Undo. Copy word for word from
// references/inbox/D18/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxRowView, InboxUi } from '../types.ts'
import { nextStep, nextStepGroups } from './nextStep.ts'
import { newTasks } from './tasksProposed.ts'

const { needsYou, nextSteps, snoozed } = nextStepGroups
const [first, ...rest] = nextSteps.rows
const created = newTasks.map(
  (task, i): InboxRowView => ({
    id: InboxItemId.parse(`new-task-${String(i + 1)}`),
    kind: 'next',
    title: task.title,
    meta: task.meta,
    age: 'now',
    blocks: null,
    approval: false,
    pill: { tone: 'running', label: 'New', dot: true },
  }),
)

export const tasksCreated = {
  title: 'the new tasks in the inbox',
  frames: [{ id: 'D18', node: '403:2479', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    count: 10,
    countLabel: '10 tasks',
    filters: [
      { value: 'all', label: 'All', count: 10 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 6 },
      { value: 'running', label: 'Running', count: 0 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    groups: [
      needsYou,
      { ...nextSteps, count: 6, rows: [...(first === undefined ? [] : [first]), ...created, ...rest] },
      snoozed,
    ],
    toast: { text: 'Created 3 tasks from a discussion', action: 'Undo' },
  },
  ui: nextStep.ui,
} satisfies ScreenState<InboxData, InboxUi>
