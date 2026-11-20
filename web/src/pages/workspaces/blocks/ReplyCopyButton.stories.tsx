import { err, ok } from '@bridge/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { ReplyCopyButton } from './ReplyCopyButton.tsx'

/** The polite live region beside the button. */
const liveRegion = (root: HTMLElement) => root.querySelector('[aria-live="polite"]')

const meta = {
  title: 'Pages/Workspaces/Blocks/ReplyCopyButton',
  component: ReplyCopyButton,
} satisfies Meta<typeof ReplyCopyButton>

export default meta
type Story = StoryObj<typeof meta>

// D1 105:874: the reply's Copy at rest.
export const Default: Story = {
  args: { label: 'Copy' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible()
  },
}

// A copy that worked: the button reads Copied, and the live region says it, then Copy again.
export const Copied: Story = {
  args: { label: 'Copy', onCopy: fn(() => Promise.resolve(ok(undefined))) },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await expect(args.onCopy).toHaveBeenCalledOnce()
    await expect(await canvas.findByRole('button', { name: 'Copied' })).toBeVisible()
    await expect(liveRegion(canvasElement)).toHaveTextContent('Copied')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible(), { timeout: 4000 })
    await expect(liveRegion(canvasElement)).toHaveTextContent('')
  },
}

// A refused or missing clipboard: the button reads Copy failed.
export const Failed: Story = {
  args: { label: 'Copy', onCopy: fn(() => Promise.resolve(err<'refused'>('refused'))) },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await expect(await canvas.findByRole('button', { name: 'Copy failed' })).toBeVisible()
    await expect(liveRegion(canvasElement)).toHaveTextContent('Copy failed')
  },
}
