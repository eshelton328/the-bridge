// Figma Inbox M5 "A question that blocks a chat": D2's question on the
// phone, with a shorter line about the waiting chat and the answer button
// pinned above the tab bar. Copy word for word from
// references/inbox/M05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { question } from './question.ts'

const detail = question.data.detail

export const questionPhone = {
  title: 'a question that blocks a chat, on the phone',
  frames: [{ id: 'M5', node: '346:9825', viewport: 'phone' }],
  data: {
    ...question.data,
    detail: {
      ...detail,
      waiting: { ...detail.waiting, title: 'hono server is waiting', detail: 'the-bridge · Sonnet 5.5 · 12 min' },
    },
  },
  ui: question.ui,
} satisfies ScreenState<InboxData, InboxUi>
