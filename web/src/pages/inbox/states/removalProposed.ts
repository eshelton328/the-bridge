// Figma Inbox D19 "Proposed removal": after the three tasks exist, the owner
// asks whether this one is still needed; the discussion proposes its
// removal in red, with a reason. Remove… asks first (D20). Copy word for
// word from references/inbox/D19/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { discussion, discussOpen } from './discussOpen.ts'

export const removalProposed = {
  title: 'proposed removal',
  frames: [{ id: 'D19', node: '403:2949', viewport: 'desktop' }],
  data: {
    ...discussOpen.data,
    discussion: {
      ...discussion,
      context: 9,
      entries: [
        { type: 'event', text: 'Created 3 tasks · Workbench, Inbox, App frame' },
        { type: 'user', text: 'Now that those exist, do we still need this one?' },
        {
          type: 'reply',
          name: 'Discussion',
          text: 'No. The three new tasks cover every screen this one asked for. If both run, NCC gets each ticket twice.',
        },
        {
          type: 'proposal',
          proposal: {
            kind: 'remove',
            label: 'Proposed · Remove this task',
            title: 'Write the tickets for increment one',
            reasonLabel: 'Reason',
            reason: 'Split into three tasks: the Workbench, Inbox and App frame tickets.',
            note: 'It moves to Done as Removed. You can restore it from there.',
            confirm: {
              title: 'Remove this task?',
              meta: 'ncc-1701 · f-005 · NCC-28 · Next step',
              text: '“Write the tickets for increment one” moves to Done as Removed, with this reason. NCC-28 in Linear stays as it is.',
            },
            // What D21 shows once the task is removed.
            removed: {
              line: 'Removed in a discussion · split into 3',
              age: '14:40',
              status: { tone: 'danger', label: 'Removed' },
              origin: 'removed today at 14:40 in a discussion',
              run: {
                agent: 'claude',
                title: 'Removed in a discussion',
                status: { tone: 'danger', label: 'Removed', dot: true },
                meta: 'Reason: split into three tasks: the Workbench, Inbox and App frame tickets.',
                open: 'Open discussion',
                openElsewhere: 'Restore',
              },
            },
          },
        },
      ],
    },
  },
  ui: discussOpen.ui,
} satisfies ScreenState<InboxData, InboxUi>
