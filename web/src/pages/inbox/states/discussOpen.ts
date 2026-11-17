// Figma Inbox D14 "Discuss, beside the task": D1 with the task's
// discussion open beside it; the list hides so both fit. Before the first
// message the discussion says what it can do and offers questions. Copy
// word for word from references/inbox/D14/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxDiscussion, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

/** D14's discussion, which D15 to D20 continue. */
export const discussion = {
  title: 'Discuss this task',
  model: 'Sonnet 5.5',
  context: 6,
  contextLabel: 'context',
  guard: "Reads this task and its sources. Can't run commands or edit files. Changes the task only when you apply.",
  entries: [],
  empty: {
    title: 'Talk this task through',
    text: 'Ask about the task, its sources or its prompt. When you ask for a change, it shows here as a proposal. Nothing changes until you apply it.',
    canLabel: 'It can',
    can: [
      { icon: 'edit', text: 'Update this task: title, why, prompt or where it runs' },
      { icon: 'plus', text: 'Create new tasks from it' },
      { icon: 'trash', text: 'Remove this task, with a reason' },
    ],
    suggestions: ['Make the prompt shorter', 'Split this into smaller tasks', 'Is this still worth doing?'],
  },
  placeholder: 'Ask about this task',
} satisfies InboxDiscussion

export const discussOpen = {
  title: 'discuss, beside the task',
  frames: [{ id: 'D14', node: '403:521', viewport: 'desktop' }],
  data: { ...nextStep.data, discussion },
  ui: { ...nextStep.ui, discussOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
