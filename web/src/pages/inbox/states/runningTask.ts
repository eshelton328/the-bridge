// Figma Inbox D6 "Running, on the task page": the started next step is
// open from the Running group. Its prompt is sent and read-only, and the
// run card shows the chat's live state. Copy word for word from
// references/inbox/D06/frame.json; the list is D5's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'
import { running } from './running.ts'

const base = nextStep.data.detail

export const runningTask = {
  title: 'running, on the task page',
  frames: [{ id: 'D6', node: '346:2301', viewport: 'desktop' }],
  data: {
    ...running.data,
    detail: {
      ...base,
      status: { tone: 'working', label: 'Running' },
      origin: 'started 3m ago',
      prompt: { ...base.prompt, sent: true },
      launch: {
        stage: 'started',
        run: {
          agent: 'claude',
          title: 'Running in quiet-nebula',
          status: { tone: 'working', label: 'Working', dot: true },
          meta: 'the-bridge · Sonnet 5.5 · Creating 9 issues in NCC…',
          open: 'Reply here',
          openElsewhere: 'Open in Workspaces',
        },
      },
    },
  },
  ui: running.ui,
} satisfies ScreenState<InboxData, InboxUi>
