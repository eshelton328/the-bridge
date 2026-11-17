// Figma Inbox D6 "Running, on the task page": the started next step is
// open from the Running group. Its prompt is sent and read-only, and the
// run card shows the chat's live state. Copy word for word from
// references/inbox/D06/frame.json; the list is D5's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'
import { running } from './running.ts'

const base = nextStep.data.detail
const { start } = base.launch

export const runningTask = {
  title: 'running, on the task page',
  frames: [{ id: 'D6', node: '346:2301', viewport: 'desktop' }],
  data: {
    ...running.data,
    detail: {
      ...base,
      // Start's result (D6): the launch's `start`.
      status: start.status,
      origin: start.origin,
      prompt: { ...base.prompt, state: 'sent' },
      launch: { stage: 'started', run: start.run },
    },
  },
  ui: running.ui,
} satisfies ScreenState<InboxData, InboxUi>
