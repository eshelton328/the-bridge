import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { TranscriptSkeleton } from './TranscriptSkeleton.tsx'

const meta = {
  title: 'Pages/Workspaces/Blocks/TranscriptSkeleton',
  component: TranscriptSkeleton,
} satisfies Meta<typeof TranscriptSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** A Claude chat that loads: the owner's bubble and a reply's lines in turn, the reply last. */
export const Claude: Story = {
  args: { label: 'Loading this chat', kind: 'claude', gap: '' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('status', { name: 'Loading this chat' })).toBeInTheDocument()
    const rows = [...canvasElement.querySelectorAll('[data-skeleton="transcript-entry"]')]
    await expect(rows).toHaveLength(4)
  },
}
