// Figma Inbox D13 "Filtered": D6 with a project filter. Filter reads
// "Filter · 1" and is pressed, the filters that apply show under the tools
// with Clear, and a line under the list counts the hidden task. Copy word
// for word from references/inbox/D13/frame.json; its metadata gives the
// hidden-count text's layer name, and frame.png shows the text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

// The project filter hides the skill-evals next step.
const groups = runningTask.data.groups.map((group) =>
  group.id === 'nextSteps'
    ? { ...group, count: 1, rows: group.rows.filter((row) => !row.meta.startsWith('skill-evals')) }
    : group,
)

export const filtered = {
  title: 'filtered',
  frames: [{ id: 'D13', node: '359:557', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    count: 6,
    countLabel: '6 tasks',
    filters: [
      { value: 'all', label: 'All', count: 6 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 1 },
      { value: 'running', label: 'Running', count: 1 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    applied: { label: 'Project', values: ['ncc-1701', 'omni-brain'], hidden: '1 task hidden by filters' },
    groups,
  },
  ui: runningTask.ui,
} satisfies ScreenState<InboxData, InboxUi>
