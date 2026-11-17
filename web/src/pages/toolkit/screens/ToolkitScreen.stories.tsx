import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { toolkitStates } from '../states/index.ts'
import { ToolkitScreen } from './ToolkitScreen.tsx'

// One story per Figma state of the Toolkit, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's
// own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Toolkit',
  component: ToolkitScreen,
} satisfies Meta<typeof ToolkitScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ToolkitList: Story = {
  name: 'D1: the list of every toolkit item',
  args: { data: toolkitStates.toolkitList.data, ui: toolkitStates.toolkitList.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /All/ })).toBeChecked()
    await expect(canvas.getByRole('heading', { name: 'agents-md' })).toBeVisible()
    await expect(canvas.getByText('agents/pr-description-checker.md')).toBeVisible()
    await expect(canvas.getByText('Read from toolkit/ in the brain')).toBeVisible()
  },
}
