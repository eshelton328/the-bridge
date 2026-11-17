import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ToolkitRow } from './ToolkitRow.tsx'

const meta = {
  title: 'Pages/Toolkit/Blocks/ToolkitRow',
  component: ToolkitRow,
} satisfies Meta<typeof ToolkitRow>

export default meta
type Story = StoryObj<typeof meta>

// Figma M1 429:96.
export const Default: Story = {
  args: {
    item: {
      kind: 'skill',
      name: 'agents-md',
      path: 'skills/agents-md/',
      description: 'Writes and audits the AGENTS.md context file in each folder',
      linksTo: 0,
      linkedFrom: 1,
      files: 5,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('agents-md')).toBeVisible()
    await expect(canvas.getByText('skills/agents-md/')).toBeVisible()
    await expect(canvas.getByText('→0 ←1')).toBeVisible()
  },
}
