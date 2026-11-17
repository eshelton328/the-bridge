import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ToolkitMap } from './ToolkitMap.tsx'

const meta = {
  title: 'Pages/Toolkit/Blocks/ToolkitMap',
  component: ToolkitMap,
} satisfies Meta<typeof ToolkitMap>

export default meta
type Story = StoryObj<typeof meta>

// A corner of Figma D2 426:362, with nothing selected: every line is quiet and no card shows.
export const Default: Story = {
  args: {
    map: {
      columns: ['Rules and hooks', 'Skills'],
      nodes: [
        { path: 'rules/commits-and-prs.md', name: 'commits-and-prs', kind: 'rule', column: 0, row: 0 },
        { path: 'hooks/commit-msg/', name: 'commit-msg', kind: 'hook', column: 0, row: 2 },
        { path: 'skills/pr-description/', name: 'pr-description', kind: 'skill', column: 1, row: 0 },
      ],
      links: [
        { from: 'hooks/commit-msg/', to: 'rules/commits-and-prs.md' },
        { from: 'skills/pr-description/', to: 'rules/commits-and-prs.md' },
      ],
    },
    selected: null,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Toolkit map' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /commit-msg/ })).toBeVisible()
    await expect(canvas.getByText('Select an item to light its links')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /Open/ })).toBeNull()
  },
}
