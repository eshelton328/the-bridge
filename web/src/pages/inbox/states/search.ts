// Figma Inbox D10 "Search": "f-005" in the search field; the list keeps
// the matching tasks and marks the query, and the selected task stays
// open. Copy word for word from references/inbox/D10/frame.json; its
// metadata names the summary and the Done hint by their layer names, so
// their text is from frame.png.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStepGroups } from './nextStep.ts'
import { runningTask } from './runningTask.ts'

const query = 'f-005'
const { needsYou } = nextStepGroups
const runningGroup = runningTask.data.groups.filter((g) => g.id === 'running')

export const search = {
  title: 'search',
  frames: [{ id: 'D10', node: '346:4030', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    search: {
      query,
      summary: '4 results for “f-005” in titles, IDs, prompts and notes',
      more: { text: 'Done has 1 more match.', link: 'Show it' },
    },
    groups: [{ ...needsYou, count: 3, rows: needsYou.rows.filter((r) => r.meta.includes(query)) }, ...runningGroup],
  },
  ui: runningTask.ui,
} satisfies ScreenState<InboxData, InboxUi>
