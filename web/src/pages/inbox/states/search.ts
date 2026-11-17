// Figma Inbox D10 "Search": "f-005" in the search field; the list keeps
// the matching tasks and marks the query, and the selected task stays
// open. Copy word for word from references/inbox/D10/frame.json; its
// metadata names the summary and the Done hint by their layer names, so
// their text is from frame.png. The list filters D6's rows by the query,
// and the summary counts them.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const search = {
  title: 'search',
  frames: [{ id: 'D10', node: '346:4030', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    search: { query: 'f-005', more: { text: 'Done has 1 more match.', link: 'Show it' } },
  },
  ui: runningTask.ui,
} satisfies ScreenState<InboxData, InboxUi>
