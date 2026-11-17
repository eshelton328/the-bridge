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
