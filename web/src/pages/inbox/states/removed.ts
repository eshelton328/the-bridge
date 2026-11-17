// Figma Inbox D21 "Removed, in Done": D20 after Remove task. The removed
// task sits in Done with its reason in red; its page offers Open
// discussion and Restore, which puts it back in Next steps. The prompt
// never ran. The removal is the state's `ui` (the remove proposal applied,
// the task finished as removed), so Restore can take it back. Copy word for
// word from references/inbox/D21/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { done } from './done.ts'
import { nextStep, nextStepGroups } from './nextStep.ts'
import { removalProposed } from './removalProposed.ts'

const task = nextStep.ui.selectedId
// D7's Done days without its finished next step: the removed task joins Today from Next steps.
const days = done.data.groups.map((group) =>
  group.id === 'today' ? { ...group, count: 1, rows: group.rows.filter((row) => row.id !== task) } : group,
)

export const removed = {
  title: 'removed, in Done',
  frames: [{ id: 'D21', node: '403:3929', viewport: 'desktop' }],
  data: {
    ...removalProposed.data,
    // Before the removal: the list takes the task out of the counts and adds it to Done (Figma: 7 in all, 2 next
    // steps, 4 in Done).
    count: 8,
    filters: [
      { value: 'all', label: 'All', count: 8 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 3 },
      { value: 'running', label: 'Running', count: 1 },
      { value: 'done', label: 'Done', count: 3 },
    ],
    groups: [nextStepGroups.needsYou, nextStepGroups.nextSteps, nextStepGroups.snoozed, ...days],
  },
  ui: {
    ...done.ui,
    selectedId: task,
    proposals: { remove: 'applied' },
    finished: [{ id: task, result: 'removed' }],
  },
} satisfies ScreenState<InboxData, InboxUi>
