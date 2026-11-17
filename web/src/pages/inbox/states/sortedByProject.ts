// Figma Inbox D11 "Sorted by project": the Sort button names the sort and
// shows it pressed; each group has a heading per project. The selected
// task stays selected. Copy word for word from
// references/inbox/D11/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxGroupView, InboxRowView, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

const byProject = (group: InboxGroupView, order: readonly string[]): InboxGroupView => {
  const project = (row: InboxRowView) => row.meta.split(' · ')[0] ?? ''
  return {
    ...group,
    projects: order
      .map((label) => ({ label, rows: group.rows.filter((row) => project(row) === label) }))
      .filter((p) => p.rows.length > 0),
  }
}

export const sortedByProject = {
  title: 'sorted by project',
  frames: [{ id: 'D11', node: '346:4416', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    sort: 'Project',
    sortActive: true,
    groups: runningTask.data.groups.map((group) =>
      byProject(group, group.id === 'nextSteps' ? ['ncc-1701', 'skill-evals'] : ['ncc-1701', 'omni-brain']),
    ),
  },
  ui: runningTask.ui,
} satisfies ScreenState<InboxData, InboxUi>
