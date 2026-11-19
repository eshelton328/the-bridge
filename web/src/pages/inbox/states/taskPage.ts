// Figma Inbox T2 and M2 "A next step": D1's next step as its own page, in
// one column under Back, before the owner wrote a note. Copy word for word from
// references/inbox/T02/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const taskPage = {
  title: 'a next step, on its own page',
  frames: [
    { id: 'T2', node: '346:5616', viewport: 'tablet' },
    { id: 'M2', node: '346:9205', viewport: 'phone' },
  ],
  data: {
    ...nextStep.data,
    detail: { ...nextStep.data.detail, notes: { add: 'Add a note for yourself…' } },
  },
  ui: nextStep.ui,
} satisfies ScreenState<InboxData, InboxUi>
