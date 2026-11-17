// Figma Inbox D12 "Snooze or dismiss": D1 with the Snooze menu open below
// the button: the snooze times, Mark done and Dismiss with a reason. Copy
// word for word from references/inbox/D12/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const snoozeOpen = {
  title: 'snooze or dismiss',
  frames: [{ id: 'D12', node: '346:4878', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    detail: {
      ...nextStep.data.detail,
      snoozeMenu: {
        heading: 'Snooze',
        times: [
          { value: 'hour', label: 'In 1 hour', time: '11:40' },
          { value: 'evening', label: 'This evening', time: '20:00' },
          { value: 'morning', label: 'Tomorrow morning', time: '9:00' },
        ],
        pick: 'Pick a date and time…',
        done: 'Mark done',
        dismiss: 'Dismiss with a reason…',
      },
    },
  },
  ui: { ...nextStep.ui, snoozeOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
