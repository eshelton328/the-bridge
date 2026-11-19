// Figma Inbox T5 and M8 "Started, the chat stays in the inbox": D5's chat
// as its own page, with no tab bar. The owner's first message is cut shorter than on
// the desktop. Copy word for word from references/inbox/T05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { running } from './running.ts'

const detail = running.data.detail
const [, ...rest] = detail.chat

export const chat = {
  title: 'the started task’s chat, on its own page',
  frames: [
    { id: 'T5', node: '346:6304', viewport: 'tablet' },
    { id: 'M8', node: '346:10810', viewport: 'phone' },
  ],
  data: {
    ...running.data,
    detail: {
      ...detail,
      chat: [
        {
          type: 'user',
          text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project…',
        },
        ...rest,
      ],
    },
  },
  ui: running.ui,
} satisfies ScreenState<InboxData, InboxUi>
