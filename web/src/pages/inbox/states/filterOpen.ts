// Figma Inbox D4 "Filter and snoozed tasks": the Filter menu is open under
// the list tools with skill-evals left out, and the Snoozed group is open.
// Copy word for word from references/inbox/D04/frame.json.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep, nextStepGroups } from './nextStep.ts'

const { needsYou, nextSteps } = nextStepGroups
const shown = nextSteps.rows.filter((row) => !row.meta.startsWith('skill-evals'))
const base = nextStep.data.detail

const item = (value: string, count: number, checked: boolean) => ({ value, label: value, count, checked })

export const filterOpen = {
  title: 'filter and snoozed tasks',
  frames: [{ id: 'D4', node: '346:1310', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    count: 6,
    countLabel: '6 tasks',
    filters: [
      { value: 'all', label: 'All', count: 6 },
      { value: 'needs', label: 'Needs you', count: 4 },
      { value: 'next', label: 'Next steps', count: 2 },
      { value: 'running', label: 'Running', count: 0 },
      { value: 'done', label: 'Done', count: 4 },
    ],
    filterMenu: {
      sections: [
        {
          label: 'Kind',
          mono: false,
          items: [
            { value: 'approval', label: 'Approval', count: 1, checked: true },
            { value: 'question', label: 'Question', count: 1, checked: true },
            { value: 'review', label: 'Review', count: 1, checked: true },
            { value: 'action', label: 'Action', count: 1, checked: true },
            { value: 'next', label: 'Next step', count: 3, checked: true },
          ],
        },
        {
          label: 'Project',
          mono: true,
          items: [item('ncc-1701', 5, true), item('omni-brain', 1, true), item('skill-evals', 1, false)],
        },
        {
          label: 'Tags · global',
          mono: true,
          items: [
            item('global/decision', 1, false),
            item('global/planning', 1, false),
            item('global/review', 1, false),
          ],
        },
        {
          label: 'Tags · project ncc-1701',
          mono: true,
          items: [item('project/ncc-1701/the-bridge', 2, false), item('project/ncc-1701/design', 1, false)],
        },
      ],
      note: 'Showing 6 of 7',
    },
    groups: [
      needsYou,
      { ...nextSteps, count: 2, rows: shown },
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
        edited: false,
        long: false,
        sent: false,
      },
      notes: null,
    },
  },
  ui: { ...nextStep.ui, filterOpen: true, groupsOpen: { ...nextStep.ui.groupsOpen, snoozed: true } },
} satisfies ScreenState<InboxData, InboxUi>
