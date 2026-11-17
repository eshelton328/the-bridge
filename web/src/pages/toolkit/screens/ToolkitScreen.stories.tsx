import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
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

export const ToolkitListTablet: Story = {
  name: 'T1: the list of every toolkit item, in two columns',
  args: { data: toolkitStates.toolkitListTablet.data, ui: toolkitStates.toolkitListTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'commits-and-prs' })).toBeVisible()
    await expect(canvas.getByText('rules/writing.md')).toBeVisible()
  },
}

export const MoreDrawer: Story = {
  name: 'M4: the More drawer over the tab bar, with Toolkit after Artifacts',
  args: { data: toolkitStates.moreDrawer.data, ui: toolkitStates.moreDrawer.ui, viewport: 'phone' },
  play: async () => {
    // The drawer renders in a portal, outside the story's canvas.
    const drawer = await within(document.body).findByRole('dialog', { name: 'More' })
    await expect(within(drawer).getByText('Agents, skills, workflows, rules and hooks')).toBeVisible()
    await expect(within(drawer).getByRole('button', { name: /Toolkit/ })).toHaveAttribute('aria-current', 'page')
    await expect(within(drawer).getByRole('button', { name: /Brain/ })).toBeDisabled()
    await expect(within(drawer).getByText('Later')).toBeVisible()
  },
}
