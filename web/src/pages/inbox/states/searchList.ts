// Figma Inbox T10 and M14 "Search": D10's list on its own, "f-005" in the search
// field, with Sort and Filter beside it. Copy word for word from
// references/inbox/T10/frame.json; its metadata names the summary and the
// Done hint by their layer names, so their text is from frame.png.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { search } from './search.ts'

export const searchList = {
  title: 'search, the list',
  frames: [
    { id: 'T10', node: '346:7503', viewport: 'tablet' },
    { id: 'M14', node: '346:11839', viewport: 'phone' },
  ],
  data: search.data,
  ui: { ...search.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
