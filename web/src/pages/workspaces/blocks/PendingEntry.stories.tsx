import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { PendingEntry } from './PendingEntry.tsx'

const meta = {
  title: 'Pages/Workspaces/Blocks/PendingEntry',
  component: PendingEntry,
} satisfies Meta<typeof PendingEntry>

export default meta
type Story = StoryObj<typeof meta>

// A message the owner just sent: its text and "Sending…" under it.
export const Sending: Story = {
  args: { text: 'Run the tests again', files: [], sending: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Run the tests again')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('Sending…')
  },
}

// A message with files: a chip for each name above the text.
export const WithFiles: Story = {
  args: { text: 'Read these', files: ['notes.txt', 'plan.pdf'], sending: true },
  play: async ({ canvas }) => {
    const chips = canvas.getByRole('group', { name: 'Files sent' })
    await expect(chips).toHaveTextContent('notes.txt')
    await expect(chips).toHaveTextContent('plan.pdf')
  },
}

// The server took it and its entry has not come, such as a prompt queued while the chat works: no line.
export const Sent: Story = {
  args: { text: 'Run the tests again', files: [], sending: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Run the tests again')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('')
  },
}
