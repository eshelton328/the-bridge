// Figma Inbox D15 "A proposed update": Erik asked for a change, and the
// discussion proposes it with the before and after: Apply, Discard or Edit
// first. Copy word for word from references/inbox/D15/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxProposal, InboxUi } from '../types.ts'
import { discussion, discussOpen } from './discussOpen.ts'

/** The proposed update of the prompt, and what Apply makes of the task (D16). */
const update = {
  kind: 'update',
  label: 'Proposed · Update this task',
  section: 'Suggested prompt',
  lines: [
    { change: 'removed', text: 'Link each ticket to its requirement IDs and leave them in Backlog' },
    {
      change: 'added',
      text: 'Link each ticket to its requirement IDs and to its Figma frame from pages.md, and leave them in Backlog',
    },
    { change: 'added', text: 'Before writing, check that each frame exists, and list any that do not.' },
  ],
  apply: {
    label: 'Applied · Update this task',
    note: 'Applied just now. The task shows the new prompt.',
    origin: 'changed just now in a discussion',
    prompt:
      'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and to its Figma frame from pages.md, and leave them in Backlog for me to review. Before writing, check that each frame exists, and list any that do not.',
    change: { line: 'Changed in a discussion · just now', undo: 'Undo' },
  },
} satisfies InboxProposal

/** D15's discussion: one question, the reply and, after it, the proposal. */
const changeDiscussion = {
  ...discussion,
  context: 9,
  entries: [
    {
      type: 'user' as const,
      text: 'Each ticket should also link to its Figma frame. And check the frames exist before writing.',
    },
    {
      type: 'reply' as const,
      name: 'Discussion',
      text: 'The frame links are in pages.md, so the run can read them there. This changes the prompt only.',
    },
    { type: 'proposal' as const, proposal: update },
  ],
}

export const changeProposed = {
  title: 'a proposed update',
  frames: [{ id: 'D15', node: '403:1001', viewport: 'desktop' }],
  data: { ...discussOpen.data, discussion: changeDiscussion },
  ui: discussOpen.ui,
} satisfies ScreenState<InboxData, InboxUi>
