import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { toolkitStates } from '../states/index.ts'
import { ToolkitScreen } from './ToolkitScreen.tsx'

// One story per Figma state of the page (scripts/checkStates.ts checks the
// page's main screen). `pnpm new state <id> --page toolkit` adds one there.
const meta = {
  title: 'Pages/Toolkit/ToolkitScreen',
  component: ToolkitScreen,
} satisfies Meta<typeof ToolkitScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ToolkitList: Story = {
  name: 'D1: The Toolkit page before it is built',
  args: { data: toolkitStates.toolkitList.data, ui: toolkitStates.toolkitList.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Toolkit' })).toBeVisible()
  },
}
