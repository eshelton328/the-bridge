// Figma Inbox D17 "Proposed new tasks": Erik asked to split the task; the
// discussion proposes three tasks, each with a checkbox, and "Also remove
// this task". Copy word for word from references/inbox/D17/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { discussion, discussOpen } from './discussOpen.ts'

/** The three tasks, which D18 shows in the list. */
export const newTasks = [
  { title: 'Write the Workbench tickets', meta: 'ncc-1701 · f-005 · from NCC-28', checked: true },
  { title: 'Write the Inbox tickets', meta: 'ncc-1701 · f-005 · from NCC-28', checked: true },
  { title: 'Write the App frame tickets', meta: 'ncc-1701 · f-005 · from NCC-28', checked: true },
]

export const tasksProposed = {
  title: 'proposed new tasks',
  frames: [{ id: 'D17', node: '403:1981', viewport: 'desktop' }],
  data: {
    ...discussOpen.data,
    discussion: {
      ...discussion,
      context: 9,
      entries: [
        { type: 'user', text: 'This is too big for one run. Split it.' },
        {
          type: 'reply',
          name: 'Discussion',
          text: 'Split by area. Each new task keeps this prompt for its own screens and links back to NCC-28.',
        },
        {
          type: 'proposal',
          proposal: {
            kind: 'create',
            label: 'Proposed · Create 3 tasks',
            tasks: newTasks,
            alsoRemove: { label: 'Also remove this task', checked: false },
          },
        },
      ],
    },
  },
  ui: discussOpen.ui,
} satisfies ScreenState<InboxData, InboxUi>
