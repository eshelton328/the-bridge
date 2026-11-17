import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { PaneSlot } from './PaneSlot.tsx'
import { Thrower } from './Thrower.tsx'

const control = { fail: true }

const meta = {
  title: 'Errors/Pane boundary',
  component: PaneSlot,
  args: { title: 'Write the tickets for increment one', contentKey: 'chat-1', onClosePane: fn() },
  beforeEach: () => {
    control.fail = true
  },
} satisfies Meta<typeof PaneSlot>

export default meta
type Story = StoryObj<typeof meta>

export const Crashed: Story = {
  args: { children: <Thrower control={control} error={new Error('A pane crashed on purpose')} /> },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('heading', { name: 'This pane failed to render' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Close pane' }))
    await expect(args.onClosePane).toHaveBeenCalledOnce()
    control.fail = false
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(canvas.getByText('Recovered')).toBeVisible()
  },
}
