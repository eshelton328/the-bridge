// Figma Inbox D3 "Edit the prompt, choose where it runs": the suggested
// prompt is in its editor with an edit, and the Run in picker is open.
// Copy word for word from references/inbox/D03/frame.json; Figma draws the
// text caret as a "|" after the prompt, which the editor's own caret shows.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

const base = nextStep.data.detail

export const promptEditing = {
  title: 'edit the prompt, choose where it runs',
  frames: [{ id: 'D3', node: '346:821', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    detail: {
      ...base,
      prompt: {
        text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and put them in the Increment 1 cycle, assigned to me.',
        suggested: base.prompt.text,
        long: false,
        state: 'suggested',
      },
      notes: null,
    },
  },
  ui: { ...nextStep.ui, editingPrompt: true, pickerOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
