import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { workspacesStates } from '../states/index.ts'
import { WorkspacesScreen } from './WorkspacesScreen.tsx'

// One story per Figma state of the page, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's own
// text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Workspaces/WorkspacesScreen',
  component: WorkspacesScreen,
} satisfies Meta<typeof WorkspacesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Workbench: Story = {
  name: 'D1: four panes, a pane menu and the skills open',
  args: { data: workspacesStates.workbench.data, ui: workspacesStates.workbench.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: /omni-brain/ })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByText('Codex wants to run a command')).toBeVisible()
    await expect(canvas.getByText('the-bridge › hono server needs you')).toBeVisible()
    // The menus and the skill list render in portals, outside the story's canvas.
    const body = within(document.body)
    await expect(await body.findByRole('menuitem', { name: /Move to workspace/ })).toBeVisible()
    await expect(await body.findByRole('menuitem', { name: 'New workspace…' })).toBeVisible()
    await expect(await body.findByRole('radio', { name: /\/writer/ })).toBeChecked()
  },
}

export const SideChat: Story = {
  name: 'D2: the workspace sidebar and a side chat',
  args: { data: workspacesStates.sideChat.data, ui: workspacesStates.sideChat.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Hide the workspace sidebar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText('theme tokens')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('Drop to move drift check into the-bridge')
    await expect(canvas.getByRole('button', { name: 'Rename omni' })).toBeVisible()
    await expect(canvas.getByRole('complementary', { name: 'Side chat' })).toBeVisible()
    await expect(canvas.getByText('Can Panda CSS switch themes while the app runs?')).toBeVisible()
  },
}

export const ChatActions: Story = {
  name: 'D2b: the chat actions menu behind the ⋯',
  args: { data: workspacesStates.chatActions.data, ui: workspacesStates.chatActions.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'bridge themes actions' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.queryByRole('status')).toBeNull()
    // The menu renders in a portal, outside the story's canvas.
    const body = within(document.body)
    await expect(await body.findByRole('menuitem', { name: 'Subagents · 2' })).toBeVisible()
    await expect(await body.findByRole('menuitem', { name: 'Folders…' })).toBeVisible()
    await expect(await body.findByRole('menuitem', { name: 'New chat' })).toBeVisible()
  },
}

export const Subagents: Story = {
  name: 'D3: the subagents panel and the New chat form',
  args: { data: workspacesStates.subagents.data, ui: workspacesStates.subagents.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    // The open dialog hides the screen behind it from assistive technology, so its roles need `hidden`.
    await expect(canvas.getByRole('complementary', { name: 'Subagents', hidden: true })).toBeVisible()
    await expect(canvas.getByText('Subtask: theme tokens')).toBeVisible()
    await expect(canvas.getByText('› Writing layout-notes.md')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Hide transcript', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // The dialog renders in a portal, outside the story's canvas.
    const body = within(document.body)
    await expect(await body.findByRole('dialog', { name: 'New chat' })).toBeVisible()
    await expect(await body.findByRole('button', { name: /Claude Code/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(await body.findByPlaceholderText('quiet-nebula')).toBeVisible()
    await expect(await body.findByRole('button', { name: /Start chat/ })).toBeVisible()
  },
}
