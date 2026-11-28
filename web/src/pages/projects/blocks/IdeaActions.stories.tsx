import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { IdeaActions } from './IdeaActions.tsx'

const ideaPage = { makeFeature: 'Make a feature', park: 'Park', questions: 'Open questions' }

const meta = {
  title: 'Pages/Projects/Blocks/IdeaActions',
  component: IdeaActions,
  args: { words: { ideaChat: 'Chat about this idea', ideaPage }, onChat: fn() },
} satisfies Meta<typeof IdeaActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Chat about this idea' }))
    await expect(args.onChat).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('button', { name: 'Make a feature' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'Park' })).toBeEnabled()
    await expect(canvas.getByRole('status')).toHaveTextContent('')
  },
}

export const Busy: Story = {
  args: { chat: { busy: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Chat about this idea' })).toBeDisabled()
  },
}

export const Missed: Story = {
  args: { chat: { line: 'This chat needs you on the Mac', retry: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('This chat needs you on the Mac')
  },
}
