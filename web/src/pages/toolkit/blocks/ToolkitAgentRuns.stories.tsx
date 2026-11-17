import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ToolkitAgentRuns } from './ToolkitAgentRuns.tsx'

const meta = {
  title: 'Pages/Toolkit/Blocks/ToolkitAgentRuns',
  component: ToolkitAgentRuns,
} satisfies Meta<typeof ToolkitAgentRuns>

export default meta
type Story = StoryObj<typeof meta>

// D7 433:526: writing-reviewer's four cards.
export const Default: Story = {
  args: {
    runs: {
      label: 'How it runs',
      facts: [
        { icon: 'model', label: 'Claude', value: 'opus', caption: 'model' },
        { icon: 'model', label: 'Codex', value: 'effort high', caption: 'codex_effort; default model' },
        { icon: 'tools', label: 'Tools', value: 'Bash, Read, Grep, Glob', caption: 'no Write or Edit' },
        { icon: 'context', label: 'Context', value: 'Its own', caption: 'gets only what the task hands it' },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'How it runs' })).toBeVisible()
    await expect(canvas.getByText('Bash, Read, Grep, Glob')).toBeVisible()
    await expect(canvas.getByText('gets only what the task hands it')).toBeVisible()
  },
}
