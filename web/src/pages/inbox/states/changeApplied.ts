// Figma Inbox D16 "The task after Apply": the task shows the new prompt
// with Undo, and the proposal turns to Applied. Nothing runs until Erik
// clicks Start. Copy word for word from references/inbox/D16/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { changeDiscussion, changeProposed, update } from './changeProposed.ts'
import { nextStep } from './nextStep.ts'

const base = nextStep.data.detail

export const changeApplied = {
  title: 'the task after Apply',
  frames: [{ id: 'D16', node: '403:1489', viewport: 'desktop' }],
  data: {
    ...changeProposed.data,
    detail: {
      ...base,
      origin: 'changed just now in a discussion',
      prompt: {
        ...base.prompt,
        text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and to its Figma frame from pages.md, and leave them in Backlog for me to review. Before writing, check that each frame exists, and list any that do not.',
        change: { line: 'Changed in a discussion · just now', undo: 'Undo' },
      },
    },
    discussion: changeDiscussion({
      ...update,
      label: 'Applied · Update this task',
      applied: 'Applied just now. The task shows the new prompt.',
    }),
  },
  ui: changeProposed.ui,
} satisfies ScreenState<InboxData, InboxUi>
