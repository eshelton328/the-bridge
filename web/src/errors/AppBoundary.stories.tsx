import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { AppBoundary } from './AppBoundary.tsx'
import { Thrower } from './Thrower.tsx'

const meta = {
  title: 'Errors/App boundary',
  component: AppBoundary,
} satisfies Meta<typeof AppBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const Crashed: Story = {
  args: { children: <Thrower control={{ fail: true }} error={new Error('A story crashed on purpose')} /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'The Bridge hit an error' })).toHaveFocus()
    await expect(canvas.getByRole('button', { name: 'Reload app' })).toBeVisible()
  },
}
