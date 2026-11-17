import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { workspacesStates } from '../states/index.ts'
import { WorkspacesScreen } from './WorkspacesScreen.tsx'

// One story per Figma state of the page (scripts/checkStates.ts checks the
// page's main screen). `pnpm new state <id> --page workspaces` adds one there.
const meta = {
  title: 'Pages/Workspaces/WorkspacesScreen',
  component: WorkspacesScreen,
} satisfies Meta<typeof WorkspacesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Workbench: Story = {
  name: 'D1: The Workspaces page before it is built',
  args: { data: workspacesStates.workbench.data, ui: workspacesStates.workbench.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Workspaces' })).toBeVisible()
  },
}
