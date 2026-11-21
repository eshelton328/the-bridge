import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { NewestButton, newestLabel } from './NewestButton.tsx'
import type { Newest, NewestView } from './usePinnedEnd.ts'

/** A store that shows `view` and calls `jump` on a press. */
const store = (view: NewestView, jump: () => void): Newest => ({
  subscribe: () => () => undefined,
  view: () => view,
  jump,
})

const meta = {
  title: 'Pages/Workspaces/Blocks/NewestButton',
  component: NewestButton,
} satisfies Meta<typeof NewestButton>

export default meta
type Story = StoryObj<typeof meta>

const jumpAway = fn()

/** The reader is more than a screen above the end: the button shows with no dot. */
export const Away: Story = {
  args: { newest: store({ shown: true, unseen: false }, jumpAway) },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: newestLabel })
    await expect(button).toBeVisible()
    await expect(button).not.toHaveAttribute('data-unseen')
    await userEvent.click(button)
    await expect(jumpAway).toHaveBeenCalledTimes(1)
  },
}

/** New entries came in while the reader was away: the button shows the dot. */
export const Unseen: Story = {
  args: { newest: store({ shown: true, unseen: true }, fn()) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: newestLabel })).toHaveAttribute('data-unseen')
  },
}

/** At the end: no button. */
export const AtEnd: Story = {
  args: { newest: store({ shown: false, unseen: false }, fn()) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: newestLabel })).toBeNull()
  },
}
