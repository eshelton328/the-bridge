import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { inboxStates } from '../states/index.ts'
import { InboxScreen } from './InboxScreen.tsx'

// One story per Figma state of the Inbox, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's
// own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Inbox',
  component: InboxScreen,
} satisfies Meta<typeof InboxScreen>

export default meta
type Story = StoryObj<typeof meta>

// Figma draws the discussion's composer focused (D14 to D19: a caret and the lighter border), the state Erik
// sees after opening the discussion. The story puts the focus there; the screen's props do not hold focus.
async function focusComposer(canvas: { getByRole: (role: 'textbox', options: { name: string }) => HTMLElement }) {
  const composer = canvas.getByRole('textbox', { name: 'Ask about this task' })
  composer.focus()
  await expect(composer).toHaveFocus()
}

export const NextStep: Story = {
  name: 'D1: a next step',
  args: { data: inboxStates.nextStep.data, ui: inboxStates.nextStep.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Allow once' })).toBeVisible()
    await expect(canvas.getByText('Codex is waiting')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Start in the-bridge' })).toBeVisible()
  },
}

export const Question: Story = {
  name: 'D2, T3: a question that blocks a chat',
  args: { data: inboxStates.question.data, ui: inboxStates.question.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Hono RPC client or plain fetch for the API?' }),
    ).toBeVisible()
    await expect(canvas.getByText('hono server is waiting for this answer')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /Hono RPC client/ })).toBeChecked()
    await expect(canvas.getByRole('button', { name: 'Answer and resume hono server' })).toBeVisible()
  },
}

export const PromptEditing: Story = {
  name: 'D3: edit the prompt, choose where it runs',
  args: { data: inboxStates.promptEditing.data, ui: inboxStates.promptEditing.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Suggested prompt' })).toHaveValue(
      inboxStates.promptEditing.data.detail.prompt.text,
    )
    await expect(canvas.getByText('Edited')).toBeVisible()
    // The picker renders in a portal, outside the story's canvas.
    const picker = await within(document.body).findByRole('dialog', { name: 'Run in' })
    await expect(within(picker).getByRole('radio', { name: /New Claude Code chat/ })).toBeChecked()
    await expect(within(picker).getByText('Shells are not listed: a prompt needs Claude Code or Codex.')).toBeVisible()
  },
}

export const FilterOpen: Story = {
  name: 'D4: filter and snoozed tasks',
  args: { data: inboxStates.filterOpen.data, ui: inboxStates.filterOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Snoozed until tomorrow 9:00')).toBeVisible()
    await expect(canvas.queryByText('Run the readme cross-family round x2')).toBeNull()
    const menu = await within(document.body).findByRole('dialog', { name: 'Filter the inbox' })
    await expect(within(menu).getByRole('checkbox', { name: 'skill-evals' })).not.toBeChecked()
    await expect(within(menu).getByRole('checkbox', { name: 'omni-brain' })).toBeChecked()
    await expect(within(menu).getByText('Showing 6 of 7')).toBeVisible()
  },
}

export const Running: Story = {
  name: 'D5: started, the chat stays in the inbox',
  args: { data: inboxStates.running.data, ui: inboxStates.running.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('quiet-nebula · Creating 9 issues…')).toBeVisible()
    await expect(canvas.getByText('Wait for increment two.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open in Workspaces' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Stop' })).toBeVisible()
  },
}

export const RunningTask: Story = {
  name: 'D6: running, on the task page',
  args: { data: inboxStates.runningTask.data, ui: inboxStates.runningTask.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Running in quiet-nebula')).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Sent prompt' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Reply here' })).toBeVisible()
  },
}

export const Done: Story = {
  name: 'D7: done',
  args: { data: inboxStates.done.data, ui: inboxStates.done.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dismissed: already done by hand')).toBeVisible()
    await expect(canvas.getByText('Finished in quiet-nebula')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open chat' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Snooze' })).toBeNull()
  },
}

export const PromptRead: Story = {
  name: 'D8: read the whole prompt',
  args: { data: inboxStates.promptRead.data, ui: inboxStates.promptRead.ui, viewport: 'desktop' },
  play: async () => {
    // The dialog renders in a portal, outside the story's canvas.
    const dialog = await within(document.body).findByRole('dialog', { name: 'Suggested prompt' })
    await expect(within(dialog).getByText('Read only. Edit opens the prompt for changes.')).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Edit prompt' })).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Copy' })).toBeVisible()
  },
}

export const SortOpen: Story = {
  name: 'D9: sort',
  args: { data: inboxStates.sortOpen.data, ui: inboxStates.sortOpen.ui, viewport: 'desktop' },
  play: async () => {
    const menu = await within(document.body).findByRole('menu')
    await expect(within(menu).getByRole('menuitemradio', { name: 'Newest first' })).toBeChecked()
    await expect(within(menu).getByText('Approvals first, next steps last')).toBeVisible()
  },
}

export const Search: Story = {
  name: 'D10: search',
  args: { data: inboxStates.search.data, ui: inboxStates.search.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('searchbox', { name: 'Search the inbox' })).toHaveValue('f-005')
    await expect(canvas.getByText('4 results for “f-005” in titles, IDs, prompts and notes')).toBeVisible()
    await expect(canvas.queryByText('Commit the brain: 34 changes')).toBeNull()
    await expect(canvas.getByRole('link', { name: 'Show it' })).toBeVisible()
  },
}

export const SortedByProject: Story = {
  name: 'D11: sorted by project',
  args: { data: inboxStates.sortedByProject.data, ui: inboxStates.sortedByProject.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Project' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('skill-evals', { selector: '.group-header__label *' })).toBeVisible()
    await expect(canvas.getByText('omni-brain', { selector: '.group-header__label *' })).toBeVisible()
  },
}

export const SnoozeOpen: Story = {
  name: 'D12: snooze or dismiss',
  args: { data: inboxStates.snoozeOpen.data, ui: inboxStates.snoozeOpen.ui, viewport: 'desktop' },
  play: async () => {
    const menu = await within(document.body).findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: /This evening/ })).toBeVisible()
    await expect(within(menu).getByRole('menuitem', { name: 'Dismiss with a reason…' })).toBeVisible()
  },
}

export const Filtered: Story = {
  name: 'D13: filtered',
  args: { data: inboxStates.filtered.data, ui: inboxStates.filtered.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filter · 1' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'Remove omni-brain' })).toBeVisible()
    await expect(canvas.getByText('1 task hidden by filters')).toBeVisible()
    await expect(canvas.queryByText('Run the readme cross-family round x2')).toBeNull()
  },
}

export const DiscussOpen: Story = {
  name: 'D14: discuss, beside the task',
  args: { data: inboxStates.discussOpen.data, ui: inboxStates.discussOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.queryByRole('region', { name: 'Inbox list' })).toBeNull()
    await expect(canvas.getByRole('heading', { name: 'Talk this task through' })).toBeVisible()
    await expect(canvas.getByRole('meter', { name: 'Context used' })).toHaveAttribute('aria-valuenow', '6')
    await focusComposer(canvas)
  },
}

export const ChangeProposed: Story = {
  name: 'D15: a proposed update',
  args: { data: inboxStates.changeProposed.data, ui: inboxStates.changeProposed.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const proposal = canvas.getByRole('group', { name: 'Proposed · Update this task' })
    await expect(within(proposal).getByRole('button', { name: 'Apply' })).toBeVisible()
    await expect(within(proposal).getByRole('button', { name: 'Edit first' })).toBeVisible()
    await expect(canvas.queryByRole('heading', { name: 'Talk this task through' })).toBeNull()
    await focusComposer(canvas)
  },
}

export const ChangeApplied: Story = {
  name: 'D16: the task after Apply',
  args: { data: inboxStates.changeApplied.data, ui: inboxStates.changeApplied.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed in a discussion · just now')).toBeVisible()
    await expect(canvas.getByText('Applied just now. The task shows the new prompt.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeVisible()
    await focusComposer(canvas)
  },
}

export const TasksProposed: Story = {
  name: 'D17: proposed new tasks',
  args: { data: inboxStates.tasksProposed.data, ui: inboxStates.tasksProposed.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Write the Inbox tickets' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Also remove this task' })).not.toBeChecked()
    await expect(canvas.getByRole('button', { name: 'Create 3 tasks' })).toBeVisible()
    await focusComposer(canvas)
  },
}

export const TasksCreated: Story = {
  name: 'D18: the new tasks in the inbox',
  args: { data: inboxStates.tasksCreated.data, ui: inboxStates.tasksCreated.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Write the App frame tickets')).toBeVisible()
    await expect(canvas.getAllByText('New')).toHaveLength(3)
    await expect(canvas.getByText('Created 3 tasks from a discussion')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Discuss' })).toBeNull()
  },
}

export const RemovalProposed: Story = {
  name: 'D19: proposed removal',
  args: { data: inboxStates.removalProposed.data, ui: inboxStates.removalProposed.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const proposal = canvas.getByRole('group', { name: 'Proposed · Remove this task' })
    await expect(within(proposal).getByRole('button', { name: 'Remove…' })).toBeVisible()
    await expect(
      within(proposal).getByText('It moves to Done as Removed. You can restore it from there.'),
    ).toBeVisible()
    await expect(canvas.getByText('Created 3 tasks · Workbench, Inbox, App frame')).toBeVisible()
    await focusComposer(canvas)
  },
}

export const RemoveConfirm: Story = {
  name: 'D20: confirm the removal',
  args: { data: inboxStates.removeConfirm.data, ui: inboxStates.removeConfirm.ui, viewport: 'desktop' },
  play: async () => {
    // The dialog renders in a portal, outside the story's canvas.
    const dialog = await within(document.body).findByRole('alertdialog', { name: 'Remove this task?' })
    await expect(within(dialog).getByText('ncc-1701 · f-005 · NCC-28 · Next step')).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Remove task' })).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Keep it' })).toBeVisible()
  },
}

export const Removed: Story = {
  name: 'D21: removed, in Done',
  args: { data: inboxStates.removed.data, ui: inboxStates.removed.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Removed in a discussion · split into 3')).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Prompt · not run' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open discussion' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Restore' })).toBeVisible()
  },
}

// The tablet frames (T1 to T8). Storybook opens at desktop; pick Tablet in the viewport menu to see the tablet
// layout, which the screen takes from its width. The play tests check text that both layouts show.

export const List: Story = {
  name: 'T1: the list',
  args: { data: inboxStates.list.data, ui: inboxStates.list.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Inbox' })).toBeVisible()
    await expect(canvas.getByText('Try the tablet layout on the iPad mini')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Allow once' })).toBeVisible()
  },
}

export const TaskPage: Story = {
  name: 'T2: a next step, on its own page',
  args: { data: inboxStates.taskPage.data, ui: inboxStates.taskPage.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })).toBeVisible()
    await expect(canvas.getByPlaceholderText('Add a note for yourself…')).toBeVisible()
    await expect(canvas.queryByText('You · 2m ago')).toBeNull()
  },
}

export const RunningTaskPage: Story = {
  name: 'T4: running, on its own task page',
  args: { data: inboxStates.runningTaskPage.data, ui: inboxStates.runningTaskPage.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Check the milestone name first.')).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Sent prompt' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Reply here' })).toBeVisible()
    await expect(canvas.queryByRole('textbox', { name: 'Add a note' })).toBeNull()
  },
}

export const Chat: Story = {
  name: 'T5: the started task’s chat, on its own page',
  args: { data: inboxStates.chat.data, ui: inboxStates.chat.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(
        'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project…',
      ),
    ).toBeVisible()
    await expect(canvas.getByText('Wait for increment two.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Stop' })).toBeVisible()
    // Figma draws the reply box focused (346:6419, a caret), as Erik sees it after Reply here.
    const reply = canvas.getByRole('textbox', { name: 'Reply' })
    reply.focus()
    await expect(reply).toHaveFocus()
  },
}

export const RunningList: Story = {
  name: 'T6: the list after starting a task',
  args: { data: inboxStates.runningList.data, ui: inboxStates.runningList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('quiet-nebula · Creating 9 issues…')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Running/ })).toBeVisible()
  },
}

export const DoneList: Story = {
  name: 'T7: Done, the list',
  args: { data: inboxStates.doneList.data, ui: inboxStates.doneList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dismissed: already done by hand')).toBeVisible()
    await expect(canvas.getByText('Rename spok to cpt-log everywhere')).toBeVisible()
  },
}

export const PromptSheet: Story = {
  name: 'T8: read the whole prompt in a sheet',
  args: { data: inboxStates.promptSheet.data, ui: inboxStates.promptSheet.ui, viewport: 'tablet' },
  play: async () => {
    // The dialog or sheet renders in a portal, outside the story's canvas.
    const sheet = await within(document.body).findByRole('dialog', { name: 'Suggested prompt' })
    await expect(within(sheet).getByText('Read only. Edit opens the prompt for changes.')).toBeVisible()
    await expect(within(sheet).getByRole('button', { name: 'Edit prompt' })).toBeVisible()
    await expect(within(sheet).getByRole('button', { name: 'Copy' })).toBeVisible()
  },
}

export const SortList: Story = {
  name: 'T9: sort, the list',
  args: { data: inboxStates.sortList.data, ui: inboxStates.sortList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    const menu = await within(document.body).findByRole('menu')
    await expect(within(menu).getByRole('menuitemradio', { name: 'Newest first' })).toBeChecked()
    await expect(canvas.getByText('quiet-nebula · Creating 9 issues…')).toBeVisible()
  },
}

export const SearchList: Story = {
  name: 'T10: search, the list',
  args: { data: inboxStates.searchList.data, ui: inboxStates.searchList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('searchbox', { name: 'Search the inbox' })).toHaveValue('f-005')
    await expect(canvas.getByText('4 results for “f-005” in titles, IDs, prompts and notes')).toBeVisible()
    await expect(canvas.queryByText('drift check wants to run git mv')).toBeNull()
  },
}

export const SortedList: Story = {
  name: 'T11: sorted by project, the list',
  args: { data: inboxStates.sortedList.data, ui: inboxStates.sortedList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Project' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('skill-evals', { selector: '.group-header__label *' })).toBeVisible()
  },
}

export const PromptEditingPage: Story = {
  name: 'T12: edit the prompt, on the task page',
  args: { data: inboxStates.promptEditingPage.data, ui: inboxStates.promptEditingPage.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Suggested prompt' })).toHaveValue(
      inboxStates.promptEditingPage.data.detail.prompt.text,
    )
    await expect(canvas.getByPlaceholderText('Add a note for yourself…')).toBeVisible()
    const picker = await within(document.body).findByRole('dialog', { name: 'Run in' })
    await expect(within(picker).getByRole('radio', { name: /New Claude Code chat/ })).toBeChecked()
  },
}

export const SnoozePage: Story = {
  name: 'T13: snooze or dismiss, on the task page',
  args: { data: inboxStates.snoozePage.data, ui: inboxStates.snoozePage.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    const menu = await within(document.body).findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: /Tomorrow morning/ })).toBeVisible()
    await expect(canvas.getByPlaceholderText('Add a note for yourself…')).toBeVisible()
  },
}

export const FilterList: Story = {
  name: 'T14: filter, the list',
  args: { data: inboxStates.filterList.data, ui: inboxStates.filterList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    const menu = await within(document.body).findByRole('dialog', { name: 'Filter the inbox' })
    await expect(within(menu).getByRole('checkbox', { name: 'skill-evals' })).not.toBeChecked()
    await expect(within(menu).getByText('Showing 6 of 7')).toBeVisible()
    // The boxes apply when the menu closes: the skill-evals next step still shows.
    await expect(canvas.getByText('Run the readme cross-family round x2')).toBeVisible()
  },
}

export const FilteredList: Story = {
  name: 'T15: filtered, the list',
  args: { data: inboxStates.filteredList.data, ui: inboxStates.filteredList.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filter · 1' })).toBeVisible()
    await expect(canvas.getByText('1 task hidden by filters')).toBeVisible()
    await expect(canvas.queryByText('Run the readme cross-family round x2')).toBeNull()
  },
}
