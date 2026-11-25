import type { PaneDialog } from '@bridge/contract'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { DialogCard } from './DialogCard.tsx'

// R69: a terminal dialog that the transcript does not hold, drawn after a blocked chat's entries. Made-up values.
const dialog: PaneDialog = {
  id: 'a1b2c3d4e5f60718',
  title: 'Sample step',
  body: 'Goal: tidy the notes\nSteps: sort, merge\nSend this to the chat?',
  options: [
    { n: 1, label: 'Send structured' },
    { n: 2, label: 'Send original' },
    { n: 3, label: 'Type something' },
    { n: 4, label: 'Chat about this' },
  ],
  raw: 'Sample step\nGoal: tidy the notes',
}
const rawOnly: PaneDialog = {
  id: 'c1b2c3d4e5f60718',
  raw: Array.from({ length: 40 }, (_, i) => `line ${String(i + 1)} of a sample menu`).join('\n'),
}

const meta = {
  title: 'Pages/Workspaces/Blocks/DialogCard',
  component: DialogCard,
  args: { view: { dialog, phase: 'ready' }, onAnswer: fn(), onRetry: fn() },
} satisfies Meta<typeof DialogCard>

export default meta
type Story = StoryObj<typeof meta>

const card = (canvas: { getByRole: (role: string, options: { name: string }) => HTMLElement }) =>
  canvas.getByRole('group', { name: 'Waiting in the terminal' })

// The dialog with its options: a tap sends the option's number.
export const Options: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(card(canvas)).toHaveTextContent('Sample step')
    await userEvent.click(canvas.getByRole('button', { name: '2 Send original' }))
    await expect(args.onAnswer).toHaveBeenCalledWith(2)
    await expect(args.onAnswer).toHaveBeenCalledOnce()
  },
}

// The answer goes: every option is off.
export const Sending: Story = {
  args: { view: { dialog, phase: 'sending' } },
  play: async ({ canvas }) => {
    for (const name of ['1 Send structured', '2 Send original', '3 Type something', '4 Chat about this'])
      await expect(canvas.getByRole('button', { name })).toBeDisabled()
  },
}

// The server answered 409: the terminal shows another dialog now.
export const Changed: Story = {
  args: { view: { dialog, phase: 'changed' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('The terminal changed — showing the new state')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '1 Send structured' })).toBeDisabled()
  },
}

// The answer missed: a line with Retry.
export const Failed: Story = {
  args: { view: { dialog, phase: 'failed', line: 'Not sent — herdr-unavailable', retry: true } },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
  },
}

// No sure options: the read text, read-only, with "Answer in the terminal".
export const ReadOnly: Story = {
  args: { view: { dialog: rawOnly, phase: 'ready' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Answer in the terminal')).toBeVisible()
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}
