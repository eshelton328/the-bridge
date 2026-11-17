// Figma Inbox T4 and M10 "Running, on the task page": D6's started next step as its
// own page, with its sent prompt read-only, Erik's note without the add
// field, and the run card above the tab bar. Copy word for word from
// references/inbox/T04/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const runningTaskPage = {
  title: 'running, on its own task page',
  frames: [
    { id: 'T4', node: '346:6077', viewport: 'tablet' },
    { id: 'M10', node: '346:10919', viewport: 'phone' },
  ],
  data: {
    ...runningTask.data,
    detail: {
      ...runningTask.data.detail,
      notes: { note: { text: 'Check the milestone name first.', by: 'You · 2m ago' } },
    },
  },
  ui: runningTask.ui,
} satisfies ScreenState<InboxData, InboxUi>
