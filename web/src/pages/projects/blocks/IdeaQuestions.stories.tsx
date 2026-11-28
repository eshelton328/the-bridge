import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { IdeaQuestions } from './IdeaQuestions.tsx'

const meta = {
  title: 'Pages/Projects/Blocks/IdeaQuestions',
  component: IdeaQuestions,
  args: {
    title: 'Open questions',
    questions: ['Which engine to try.', 'Where the word list lives.', 'Which engine to try.'],
  },
} satisfies Meta<typeof IdeaQuestions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
    await expect(canvas.getByText('3')).toBeVisible()
  },
}

export const None: Story = {
  args: { questions: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe('')
  },
}
