// Figma Inbox M22 "The new tasks in the inbox": back in the inbox on the
// phone after Create, the three new tasks under Next steps with a New pill
// and a toast that offers Undo; Needs you is closed. The tasks come from
// the discussion's proposal applied in `ui`, so Undo takes them out. Copy
// word for word from references/inbox/M22/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'
import { tasksProposed } from './tasksProposed.ts'

export const tasksCreatedPhone = {
  title: 'the new tasks in the inbox, on the phone',
  frames: [{ id: 'M22', node: '402:7322', viewport: 'phone' }],
  data: tasksProposed.data,
  ui: {
    ...nextStep.ui,
    selectedId: null,
    groupsOpen: { ...nextStep.ui.groupsOpen, needsYou: false },
    proposals: { create: 'applied' },
  },
} satisfies ScreenState<InboxData, InboxUi>
