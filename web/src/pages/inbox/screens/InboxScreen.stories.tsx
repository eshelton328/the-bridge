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
  name: 'D2: a question that blocks a chat',
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
    await expect(canvas.getByText('skill-evals', { selector: 'div' })).toBeVisible()
    await expect(canvas.getByText('omni-brain', { selector: 'div' })).toBeVisible()
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
