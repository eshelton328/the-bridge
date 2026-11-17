// Figma Inbox T15 and M16 "Filtered": D13's list on its own. Filter reads
// "Filter · 1" and is pressed, the filters that apply show under the
// tools with Clear, and a line under the list counts the hidden task. Copy
// word for word from references/inbox/T15/frame.json; its metadata gives
// the hidden-count text's layer name, and frame.png shows the text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { filtered } from './filtered.ts'

export const filteredList = {
  title: 'filtered, the list',
  frames: [
    { id: 'T15', node: '359:260', viewport: 'tablet' },
    { id: 'M16', node: '359:2', viewport: 'phone' },
  ],
  data: filtered.data,
  ui: { ...filtered.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
