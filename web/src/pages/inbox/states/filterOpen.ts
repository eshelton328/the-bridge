// Figma Inbox D4 "Filter and snoozed tasks": the Filter menu is open under
// the list tools with skill-evals left out, which the list already applies,
// and the Snoozed group is open.
// Copy word for word from references/inbox/D04/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { projectFilter } from './filtered.ts'
import { nextStep, nextStepGroups } from './nextStep.ts'

const { needsYou, nextSteps } = nextStepGroups
const base = nextStep.data.detail

export const filterOpen = {
  title: 'filter and snoozed tasks',
  frames: [{ id: 'D4', node: '346:1310', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    groups: [
      needsYou,
      nextSteps,
      {
        id: 'snoozed',
        label: 'Snoozed',
        count: 1,
        dot: null,
        rows: [
          {
            id: InboxItemId.parse('tailscale-acl-reply'),
            kind: 'review',
            title: 'Reply on the Tailscale ACL change',
            meta: 'ncc-1701 · infra',
            age: '',
            blocks: null,
            approval: false,
            snoozed: { line: 'Snoozed until tomorrow 9:00', age: 'until 9:00' },
          },
        ],
      },
    ],
    detail: {
      ...base,
      prompt: {
        text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and leave them in Backlog for me to review.',
        long: false,
        state: 'suggested',
      },
      notes: null,
    },
  },
  ui: {
    ...nextStep.ui,
    filterOpen: true,
    filterChecks: projectFilter,
    filters: projectFilter,
    groupsOpen: { ...nextStep.ui.groupsOpen, snoozed: true },
  },
} satisfies ScreenState<InboxData, InboxUi>
