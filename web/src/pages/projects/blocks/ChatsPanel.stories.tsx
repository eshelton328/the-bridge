import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { ChatsPanel } from './ChatsPanel.tsx'

const words = {
  title: 'Chats',
  none: 'No chats tagged with this project',
  statuses: { working: 'Working', needsYou: 'Needs you', idle: 'Idle', done: 'Done', unknown: 'Unknown' },
  search: 'Search chats',
  chips: 'Filter by area',
  noMatch: 'No chat matches',
}
// 12 chats of area/bridge and 6 of area/library.
const rows = Array.from({ length: 18 }, (_, i) => ({
  id: `sample/c${String(i + 1)}`,
  title: `Sample chat ${String(i + 1)}`,
  workspace: 'sample',
  status: 'idle' as const,
  tags: [i < 12 ? 'area/bridge' : 'area/library', 'role/builder'],
}))

const meta = {
  title: 'Pages/Projects/Blocks/ChatsPanel',
  component: ChatsPanel,
  args: { words, layout: 'desktop', chats: { rows } },
} satisfies Meta<typeof ChatsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Pages: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1–10 of 18')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(canvas.getByText('11–18 of 18')).toBeVisible()
    await expect(canvas.getByText('Sample chat 18')).toBeVisible()
  },
}

export const Filtered: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /area\/library/ }))
    await expect(canvas.getByText('1–6 of 6')).toBeVisible()
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search chats' }), 'nothing like this')
    await expect(canvas.getByText('No chat matches')).toBeVisible()
  },
}

export const Phone: Story = {
  args: { layout: 'phone' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1–10 of 18')).toBeVisible()
    await expect(canvas.queryByRole('combobox')).toBeNull()
  },
}

export const NotRead: Story = {
  args: { chats: { rows: [], notRead: 'Chats not read — the server answered 500' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Chats not read — the server answered 500')
    await expect(canvas.queryByText('0')).toBeNull()
  },
}
