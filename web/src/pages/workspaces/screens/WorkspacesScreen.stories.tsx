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

export const ChatInWorkbench: Story = {
  name: 'D7: one chat in the workbench beside the sidebar',
  args: { data: workspacesStates.chatInWorkbench.data, ui: workspacesStates.chatInWorkbench.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Hide the workspace sidebar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.queryByRole('button', { name: 'Show the workspace sidebar' })).toBeNull()
    await expect(canvas.getByRole('tab', { name: /omni-brain/ })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('omni-brain · 1 pane')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.queryByText('Codex wants to run a command')).toBeNull()
  },
}

export const DragOverPane: Story = {
  name: 'D8: a chat dragged over a pane of the workbench',
  args: { data: workspacesStates.dragOverPane.data, ui: workspacesStates.dragOverPane.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 1 pane')).toBeVisible()
    const zone = canvas.getByRole('status')
    await expect(zone).toHaveTextContent('Open drift check to the right')
    await expect(zone).toHaveTextContent('splits bridge themes into two panes side by side')
    // The drop zone over a pane has no hint on where to drop, unlike D6's.
    await expect(canvas.queryByText(/edge: split beside/)).toBeNull()
  },
}

export const TwoPanes: Story = {
  name: 'D9: two panes side by side, with the resize handle between them',
  args: { data: workspacesStates.twoPanes.data, ui: workspacesStates.twoPanes.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 2 panes')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'drift check' })).toBeVisible()
    await expect(canvas.getByText('Codex wants to run a command')).toBeVisible()
    // The two panes share the width; the handle between them resizes them (D14).
    await expect(canvas.getByLabelText('Resize columns')).toBeVisible()
    await expect(canvas.queryByRole('status')).toBeNull()
  },
}

export const DragBelowPane: Story = {
  name: 'D10: a third chat dragged below one pane of two',
  args: { data: workspacesStates.dragBelowPane.data, ui: workspacesStates.dragBelowPane.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 2 panes')).toBeVisible()
    const zone = canvas.getByRole('status')
    await expect(zone).toHaveTextContent('Open brain git below drift check')
    await expect(zone).toHaveTextContent('splits drift check into two panes, one above the other')
    // The zone is in drift check's pane alone, so bridge themes keeps its full height.
    await expect(zone).not.toHaveTextContent('bridge themes')
  },
}

export const ThreePanes: Story = {
  name: 'D11: three panes, bridge themes on the left and two stacked on the right',
  args: { data: workspacesStates.threePanes.data, ui: workspacesStates.threePanes.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 3 panes')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'drift check' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'brain git' })).toBeVisible()
    // Each gap has its own handle: one between the columns, one between the right column's rows.
    await expect(canvas.getByLabelText('Resize columns')).toBeVisible()
    await expect(canvas.getByLabelText('Resize rows')).toBeVisible()
  },
}

export const FourPanes: Story = {
  name: 'D12: four panes, the most, and a chat dragged over one replaces it',
  args: { data: workspacesStates.fourPanes.data, ui: workspacesStates.fourPanes.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 4 panes')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'brain git' })).toBeVisible()
    await expect(canvas.getByText('Empty pane')).toBeVisible()
    const zone = canvas.getByRole('status')
    await expect(zone).toHaveTextContent('Replace drift check with hono server')
    await expect(zone).toHaveTextContent('Four panes is the most. drift check keeps running in the sidebar.')
  },
}
