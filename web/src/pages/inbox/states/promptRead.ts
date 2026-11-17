// Figma Inbox D8 "Read the whole prompt": D1 with the suggested prompt open
// read-only in a dialog over the inbox. Copy word for word from
// references/inbox/D08/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const promptRead = {
  title: 'read the whole prompt',
  frames: [{ id: 'D8', node: '346:3120', viewport: 'desktop' }],
  data: nextStep.data,
  ui: { ...nextStep.ui, promptOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
