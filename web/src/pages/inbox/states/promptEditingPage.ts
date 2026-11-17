// Figma Inbox T12 "Edit the prompt, choose where it runs": D3 on the task
// page, under Back: the prompt in its editor with an edit, and the Run in
// picker open below Change; My notes has T2's empty field. Copy word for
// word from references/inbox/T12/frame.json; Figma draws the text caret
// as a "|" after the prompt, which the editor's own caret shows.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { promptEditing } from './promptEditing.ts'
import { taskPage } from './taskPage.ts'

export const promptEditingPage = {
  title: 'edit the prompt, on the task page',
  frames: [{ id: 'T12', node: '346:8035', viewport: 'tablet' }],
  data: {
    ...promptEditing.data,
    detail: { ...promptEditing.data.detail, notes: taskPage.data.detail.notes },
  },
  ui: promptEditing.ui,
} satisfies ScreenState<InboxData, InboxUi>
