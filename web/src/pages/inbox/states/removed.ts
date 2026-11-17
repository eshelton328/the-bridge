// Figma Inbox D21 "Removed, in Done": the removed task sits in Done with
// its reason in red. Its page offers Open discussion and Restore; the
// prompt never ran. Copy word for word from
// references/inbox/D21/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { done } from './done.ts'
import { nextStep } from './nextStep.ts'

const base = nextStep.data.detail
// The finished next step of D7 is the removed task here.
const groups = done.data.groups.map((group) =>
  group.id === 'today'
    ? {
        ...group,
        rows: group.rows.map((row, i) =>
          i === 0
            ? {
                ...row,
                age: '14:40',
                outcome: { line: 'Removed in a discussion · split into 3', result: 'removed' as const },
              }
            : row,
        ),
      }
    : group,
)

export const removed = {
  title: 'removed, in Done',
  frames: [{ id: 'D21', node: '403:3929', viewport: 'desktop' }],
  data: {
    ...done.data,
    filters: [
      { value: 'all', label: 'All', count: 7 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 2 },
      { value: 'running', label: 'Running', count: 1 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    groups,
    detail: {
      ...base,
      status: { tone: 'danger', label: 'Removed' },
      origin: 'removed today at 14:40 in a discussion',
      actions: false,
      prompt: { ...base.prompt, state: 'notRun' },
      launch: {
        stage: 'started',
        run: {
          agent: 'claude',
          title: 'Removed in a discussion',
          status: { tone: 'danger', label: 'Removed', dot: true },
          meta: 'Reason: split into three tasks: the Workbench, Inbox and App frame tickets.',
          open: 'Open discussion',
          openElsewhere: 'Restore',
        },
      },
    },
  },
  ui: done.ui,
} satisfies ScreenState<InboxData, InboxUi>
