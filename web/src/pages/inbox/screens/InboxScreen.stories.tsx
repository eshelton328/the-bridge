import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { inboxStates } from '../states/index.ts'
import { InboxScreen } from './InboxScreen.tsx'

// One story per Figma state of the Inbox, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's
// own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Inbox',
  component: InboxScreen,
} satisfies Meta<typeof InboxScreen>

export default meta
type Story = StoryObj<typeof meta>

export const NextStep: Story = {
  name: 'D1: a next step',
  args: { data: inboxStates.nextStep.data, ui: inboxStates.nextStep.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Allow once' })).toBeVisible()
    await expect(canvas.getByText('Codex is waiting')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Start in the-bridge' })).toBeVisible()
  },
}
