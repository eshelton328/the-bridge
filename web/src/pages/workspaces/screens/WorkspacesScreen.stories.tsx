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

export const Folders: Story = {
  name: 'D4: the folders control, its list and the folder picker',
  args: { data: workspacesStates.folders.data, ui: workspacesStates.folders.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '~/omni-brain +1' })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('complementary', { name: 'Add a folder' })).toBeVisible()
    await expect(canvas.getByText('Folders on the Mac that runs the-bridge.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '~/the-bridge' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: /Add ~\/the-bridge/ })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'drift check actions' })).toBeNull()
    // The folder list renders in a portal, outside the story's canvas.
    const body = within(document.body)
    await expect(await body.findByText('working folder')).toBeVisible()
    await expect(await body.findByRole('button', { name: 'Remove ~/omni' })).toBeVisible()
  },
}

export const SideChatInPane: Story = {
  name: 'D5: a side chat inside its pane of the split',
  args: { data: workspacesStates.sideChatInPane.data, ui: workspacesStates.sideChatInPane.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const side = canvas.getByRole('complementary', { name: 'Side chat' })
    await expect(side).toBeVisible()
    await expect(within(side).getByText('Beside bridge themes only. The other panes keep running.')).toBeVisible()
    await expect(within(side).getByText('Does Viewscreen need a light variant?')).toBeVisible()
    await expect(within(side).getByRole('button', { name: 'Open as its own pane' })).toBeVisible()
    // The other panes keep running beside it.
    await expect(canvas.getByText('Codex wants to run a command')).toBeVisible()
    await expect(canvas.queryByRole('menuitem', { name: /Move to workspace/ })).toBeNull()
  },
}

export const DragIntoPane: Story = {
  name: 'D6: a chat dragged onto the chat shown alone',
  args: { data: workspacesStates.dragIntoPane.data, ui: workspacesStates.dragIntoPane.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const zone = canvas.getByRole('status')
    await expect(zone).toHaveTextContent('Open hono server beside bridge themes')
    await expect(within(zone).getByText('splits the view into two panes')).toBeVisible()
    await expect(within(zone).getByText('edge: split beside, above or below · middle: replace this chat')).toBeVisible()
    await expect(canvas.queryByRole('complementary', { name: 'Side chat' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Rename omni' })).toBeVisible()
  },
}
