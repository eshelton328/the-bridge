import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { BlockBoundary } from './BlockBoundary.tsx'
import { Thrower } from './Thrower.tsx'

const control = { fail: true }

const meta = {
  title: 'Errors/Block boundary',
  component: BlockBoundary,
  beforeEach: () => {
    control.fail = true
  },
} satisfies Meta<typeof BlockBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const Crashed: Story = {
  args: {
    contentKey: 'readme',
    children: <Thrower control={control} error={new Error('A block crashed on purpose')} />,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('This part failed to render.')
    control.fail = false
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(canvas.getByText('Recovered')).toBeVisible()
  },
}
