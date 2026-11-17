// Figma Inbox D5 "Started, the chat stays in the inbox": the next step
// runs in a new chat; its row moved to the Running group and the detail
// shows the chat with a reply box. Copy word for word from
// references/inbox/D05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep, nextStepGroups, startedChat } from './nextStep.ts'

const { needsYou, nextSteps, snoozed } = nextStepGroups
const started = nextStep.ui.selectedId
const waiting = nextSteps.rows.filter((row) => row.id !== started)

export const running = {
  title: 'started, the chat stays in the inbox',
  frames: [{ id: 'D5', node: '346:1909', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    filters: [
      { value: 'all', label: 'All', count: 7 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 2 },
      { value: 'running', label: 'Running', count: 1 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    groups: [
      needsYou,
      { ...nextSteps, count: 2, rows: waiting },
      snoozed,
      {
        id: 'running',
        label: 'Running',
        count: 1,
        dot: 'working',
        rows: nextSteps.rows
          .filter((row) => row.id === started)
          .map((row) => ({
            ...row,
            running: {
              agent: 'claude',
              line: 'quiet-nebula · Creating 9 issues…',
              status: { tone: 'working', label: 'Working', dot: true },
            },
          })),
      },
    ],
    detail: startedChat,
  },
  ui: { ...nextStep.ui, groupsOpen: { ...nextStep.ui.groupsOpen, running: true } },
} satisfies ScreenState<InboxData, InboxUi>
