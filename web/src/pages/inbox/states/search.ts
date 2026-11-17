// Figma Inbox D10 "Search": "f-005" in the search field; the list keeps
// the matching tasks and marks the query, and the selected task stays
// open. Copy word for word from references/inbox/D10/frame.json; its
// metadata names the summary and the Done hint by their layer names, so
// their text is from frame.png. The list filters D6's rows by the query,
// and the summary counts them. No frame draws the Done match the hint
// names: Show it selects the Done chip, which lists `done`, one finished
// task from yesterday whose meta line has f-005.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { runningTask } from './runningTask.ts'

export const search = {
  title: 'search',
  frames: [{ id: 'D10', node: '346:4030', viewport: 'desktop' }],
  data: {
    ...runningTask.data,
    search: {
      query: 'f-005',
      more: { text: 'Done has 1 more match.', link: 'Show it' },
      done: [
        {
          id: 'yesterday',
          label: 'Yesterday',
          count: 1,
          dot: null,
          rows: [
            {
              id: InboxItemId.parse('save-the-inbox-frames'),
              kind: 'next',
              title: 'Save the Inbox frames as references',
              meta: 'ncc-1701 · f-005 · NCC-27',
              age: 'Fri',
              blocks: null,
              approval: false,
              outcome: { line: 'Finished in calm-orbit · 61 frames saved', result: 'done' },
            },
          ],
        },
      ],
    },
  },
  // The Done list that Show it opens shows its day open.
  ui: { ...runningTask.ui, groupsOpen: { ...runningTask.ui.groupsOpen, yesterday: true } },
} satisfies ScreenState<InboxData, InboxUi>
