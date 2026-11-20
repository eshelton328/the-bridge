import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { SlotBoundary } from './SlotBoundary.tsx'
import { Thrower } from './Thrower.tsx'

const control = { fail: true }

const meta = {
  title: 'Errors/Slot boundary',
  component: SlotBoundary,
  beforeEach: () => {
    control.fail = true
  },
} satisfies Meta<typeof SlotBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const Crashed: Story = {
  args: {
    contentKey: 'chat-1',
    children: <Thrower control={control} error={new Error('A slot crashed on purpose')} />,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('This part of the page failed to render')
    control.fail = false
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(canvas.getByText('Recovered')).toBeVisible()
  },
}
