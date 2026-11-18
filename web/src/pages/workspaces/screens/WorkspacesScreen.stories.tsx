import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { expectTrapFocus } from '../../../lib/focusTrap.ts'
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

export const EmptiedPane: Story = {
  name: 'D13: an emptied pane keeps its place and offers Close pane',
  args: { data: workspacesStates.emptiedPane.data, ui: workspacesStates.emptiedPane.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 4 panes')).toBeVisible()
    await expect(canvas.getByText('Empty pane')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Close pane' })).toBeVisible()
    await expect(canvas.getByText('Cmd+W', { selector: 'button' })).toBeVisible()
    await expect(canvas.queryByRole('status')).toBeNull()
  },
}

export const ResizedPanes: Story = {
  name: 'D14: brain git takes the bottom row and the top row resizes 60 : 40',
  args: { data: workspacesStates.resizedPanes.data, ui: workspacesStates.resizedPanes.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · 3 panes')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('60 : 40 · double-click for 50 : 50')
    // Rows first: one handle between the top row's panes and one between the rows; brain git's row has none.
    await expect(canvas.getByLabelText('Resize columns')).toBeVisible()
    await expect(canvas.getByLabelText('Resize rows')).toBeVisible()
  },
}

export const ForkDialog: Story = {
  name: 'D15: Fork asks for a name and where the copy starts',
  args: { data: workspacesStates.forkDialog.data, ui: workspacesStates.forkDialog.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.'),
    ).toBeVisible()
    // The dialog renders in a portal, outside the story's canvas.
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'Fork bridge themes' }))
    await expect(dialog.getByRole('textbox', { name: 'NAME' })).toHaveValue('bridge themes · fork')
    await expect(dialog.getByRole('button', { name: 'Whole chat' })).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByRole('button', { name: 'Up to a message…' })).toHaveAttribute('aria-pressed', 'false')
    await expect(
      dialog.getByText('The fork copies the messages and the context. The original keeps running.'),
    ).toBeVisible()
  },
}

export const ForkedChat: Story = {
  name: 'D16: the fork listed under its original and shown alone, Idle',
  args: { data: workspacesStates.forkedChat.data, ui: workspacesStates.forkedChat.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'bridge themes · fork' })).toBeVisible()
    await expect(canvas.getByText('omni-brain · forked from bridge themes')).toBeVisible()
    await expect(canvas.getByText('Forked from bridge themes here · the messages above are a copy')).toBeVisible()
    await expect(canvas.getByRole('img', { name: 'Fork of bridge themes' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'bridge themes · fork', current: true })).toBeVisible()
    // The fork is Idle: its composer has no Stop.
    await expect(canvas.queryByRole('button', { name: /Stop/ })).toBeNull()
  },
}

export const SubtaskDialog: Story = {
  name: 'D17: Subtask asks what the subagent should do and which model runs it',
  args: { data: workspacesStates.subtaskDialog.data, ui: workspacesStates.subtaskDialog.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.'),
    ).toBeVisible()
    // The dialog renders in a portal, outside the story's canvas.
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'Start a subtask' }))
    await expect(dialog.getByRole('button', { name: 'MODEL: Sonnet 5.5 · high effort' })).toBeVisible()
    const task = dialog.getByRole('textbox', { name: 'WHAT SHOULD THE SUBTASK DO?' })
    await expect(task).toHaveValue('Draft layout notes for the three directions, one page each.')
    // The dialog's focus trap moves the focus to the task in the frame after it opens.
    await expectTrapFocus(task)
    await expect(dialog.getByText('Gets this chat’s full context. Returns its result here.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Start subtask' })).toBeVisible()
  },
}

export const SubtaskRunning: Story = {
  name: 'D18: the subtask listed under its chat, Running, and where it started',
  args: { data: workspacesStates.subtaskRunning.data, ui: workspacesStates.subtaskRunning.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByText('Subtask layout notes started · returns its result here')).toBeVisible()
    await expect(canvas.getByText('layout notes')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'bridge themes', current: true })).toBeVisible()
    // bridge themes keeps working: its composer has Stop.
    await expect(canvas.getByRole('button', { name: /Stop/ })).toBeVisible()
  },
}

export const MoveToWorkspace: Story = {
  name: 'D19: Move to workspace with its list of workspaces open',
  args: { data: workspacesStates.moveToWorkspace.data, ui: workspacesStates.moveToWorkspace.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'bridge themes actions' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.queryByRole('complementary', { name: 'Side chat' })).toBeNull()
    // The menu and its list render in portals, outside the story's canvas.
    const body = within(document.body)
    await expect(await body.findByRole('menuitem', { name: /Move to workspace/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(await body.findByRole('menuitem', { name: 'skill-evals' })).toBeVisible()
    await expect(await body.findByRole('menuitem', { name: 'New workspace…' })).toBeVisible()
    await expect(body.queryByRole('menuitem', { name: 'omni-brain' })).toBeNull()
  },
}

export const MovedChat: Story = {
  name: 'D20: the chat moved to the-bridge, with a toast and Undo',
  args: { data: workspacesStates.movedChat.data, ui: workspacesStates.movedChat.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    // The chat and its subtask chat now head the-bridge's list.
    const header = canvas.getByRole('button', { name: /the-bridge/i, expanded: true })
    const rows = document.getElementById(header.getAttribute('aria-controls') ?? '')
    await expect(rows).toContainElement(canvas.getByRole('button', { name: 'bridge themes', current: true }))
    await expect(rows).toContainElement(canvas.getByText('theme tokens'))
    await expect(canvas.getByText('the-bridge', { selector: 'header span' })).toBeVisible()
    // The toast stays open: the fidelity check renders the story after its play test.
    const toast = canvas.getByRole('status')
    await expect(toast).toHaveTextContent('Moved bridge themes to the-bridge')
    await expect(within(toast).getByRole('button', { name: 'Undo' })).toBeVisible()
  },
}

export const RenameChat: Story = {
  name: 'D21: Rename chat, the name in the header as a field',
  args: { data: workspacesStates.renameChat.data, ui: workspacesStates.renameChat.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    // The field takes the heading's place and takes the focus in the frame after it opens (ChatNameField).
    const field = canvas.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expectTrapFocus(field)
    await expect(field).toHaveValue('bridge themes')
    await expect(canvas.queryByRole('heading', { name: 'bridge themes' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Undo the rename' })).toBeVisible()
    await expect(canvas.queryByRole('complementary', { name: 'Side chat' })).toBeNull()
  },
}

export const PhoneHome: Story = {
  name: 'M1: every workspace and chat on the phone',
  args: { data: workspacesStates.phoneHome.data, ui: workspacesStates.phoneHome.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: Storybook opens at desktop, where the state draws D2b's sidebar with bridge
    // themes alone; the phone's menu draws M1. WorkspacesLayout.test.tsx checks the phone layout at a phone's width.
    await expect(canvas.getByText('release notes')).toBeVisible()
    await expect(canvas.getByText('dev server')).toBeVisible()
    await expect(canvas.queryByRole('status')).toBeNull()
    await expect(canvas.queryByRole('complementary', { name: 'Side chat' })).toBeNull()
    await expect(within(document.body).queryByRole('menu')).toBeNull()
  },
}

export const PhoneEdit: Story = {
  name: 'M2: edit mode on the phone, with a chat and a workspace renamed in place',
  args: { data: workspacesStates.phoneEdit.data, ui: workspacesStates.phoneEdit.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone,
    // and the phone's menu draws M2. WorkspacesLayout.test.tsx checks edit mode at a phone's width.
    await expect(canvas.getByText('drift check')).toBeVisible()
    await expect(canvas.queryByText('theme tokens')).toBeNull()
    await expect(canvas.queryByRole('complementary', { name: 'Side chat' })).toBeNull()
  },
}

export const PhoneChat: Story = {
  name: 'M3: a chat on the phone, with the skills listed after "/"',
  args: { data: workspacesStates.phoneChat.data, ui: workspacesStates.phoneChat.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone,
    // its skills open, and the phone's menu draws M3. WorkspacesPhoneChat.test.tsx checks the chat at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByText('requirements.md')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Stop' })).toBeVisible()
    await expect(await within(document.body).findByRole('radio', { name: /\/writer/ })).toBeChecked()
  },
}

export const PhoneChatActions: Story = {
  name: 'M4: the actions on a chat, in a sheet on the phone',
  args: { data: workspacesStates.phoneChatActions.data, ui: workspacesStates.phoneChatActions.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone and
    // its chat actions menu open on Move to workspace; at a phone's width the sheet draws M4.
    // WorkspacesPhoneChatActions.test.tsx checks the sheet at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    const body = within(document.body)
    await expect(await body.findByText('Move to workspace')).toBeVisible()
    await expect(await body.findByText('New workspace…')).toBeVisible()
  },
}

export const PhoneSideChat: Story = {
  name: 'M5: the side chat on the phone, in a sheet over the main chat',
  args: { data: workspacesStates.phoneSideChat.data, ui: workspacesStates.phoneSideChat.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone and
    // the side chat beside it; at a phone's width the sheet draws M5. WorkspacesPhoneSideChat.test.tsx checks the
    // sheet at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(
      canvas.getByText('Nothing here enters bridge themes. Close it and the main chat carries on.'),
    ).toBeVisible()
  },
}

export const PhoneSubagents: Story = {
  name: "M6: a chat's subagents on the phone",
  args: { data: workspacesStates.phoneSubagents.data, ui: workspacesStates.phoneSubagents.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone and
    // the subagents panel beside it; at a phone's width the subagents fill the screen (M6).
    // WorkspacesPhoneSubagents.test.tsx checks them at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    const panel = canvas.getByRole('complementary', { name: 'Subagents' })
    await expect(within(panel).getByText('› Writing layout-notes.md')).toBeVisible()
    await expect(within(panel).getByRole('button', { name: 'Hide transcript' })).toBeVisible()
  },
}

export const PhoneNewChat: Story = {
  name: 'M7: New chat on the phone',
  args: { data: workspacesStates.phoneNewChat.data, ui: workspacesStates.phoneNewChat.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone and
    // D3's New chat dialog over it; at a phone's width the form fills the screen (M7).
    // WorkspacesPhoneNewChat.test.tsx checks it at a phone's width.
    // The open dialog hides the screen behind it from assistive technology, so its roles need `hidden`.
    await expect(canvas.getByRole('heading', { name: 'bridge themes', hidden: true })).toBeVisible()
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'New chat' }))
    await expect(dialog.getByRole('button', { name: 'MODEL: Sonnet 5.5 · high effort' })).toBeVisible()
    await expectTrapFocus(dialog.getByRole('textbox', { name: 'FIRST MESSAGE' }))
  },
}

export const PhoneFolders: Story = {
  name: "M8: the chat's folders on the phone, with the folder picker",
  args: { data: workspacesStates.phoneFolders.data, ui: workspacesStates.phoneFolders.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with drift check alone, D4's
    // folders list and the folder picker beside it; at a phone's width the folders sheet draws M8.
    // WorkspacesPhoneFolders.test.tsx checks the sheet at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'drift check' })).toBeVisible()
    const picker = canvas.getByRole('complementary', { name: 'Add a folder' })
    await expect(within(picker).getByText('Folders on the Mac that runs the-bridge.')).toBeVisible()
    await expect(within(picker).getByRole('button', { name: 'Open the-bridge' })).toBeVisible()
    // M8's picker lists the folders of ~/ without D4's Documents.
    await expect(within(picker).queryByRole('button', { name: 'Open Documents' })).toBeNull()
  },
}

export const PhoneHoldChat: Story = {
  name: 'M9: a chat held in the phone list, with its actions in a sheet',
  args: { data: workspacesStates.phoneHoldChat.data, ui: workspacesStates.phoneHoldChat.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone;
    // at a phone's width the held row lifts over the actions sheet (M9). WorkspacesPhoneHoldChat.test.tsx checks the
    // sheet and the hold at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByText('drift check')).toBeVisible()
    await expect(canvas.queryByRole('dialog', { name: 'drift check' })).toBeNull()
  },
}

export const PhoneKeyboard: Story = {
  name: 'M10: a chat on the phone with the keyboard open',
  args: { data: workspacesStates.phoneKeyboard.data, ui: workspacesStates.phoneKeyboard.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone,
    // its skills open on "/wri"; at a phone's width the header is one line (M10). WorkspacesPhoneChat.test.tsx checks
    // the one-line header at a phone's width.
    await expect(canvas.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Message, or / for a skill' })).toHaveValue(
      'Turn the layout notes into a doc with /wri',
    )
    const body = within(document.body)
    await expect(await body.findByText('SKILLS MATCHING /wri')).toBeInTheDocument()
    await expect(await body.findByRole('radio', { name: /\/writer/ })).toBeChecked()
    await expect(body.queryByRole('radio', { name: /\/readme/ })).toBeNull()
  },
}

export const PhoneNewChatKeyboard: Story = {
  name: 'M11: New chat on the phone with the keyboard open',
  args: {
    data: workspacesStates.phoneNewChatKeyboard.data,
    ui: workspacesStates.phoneNewChatKeyboard.ui,
    viewport: 'phone',
  },
  play: async ({ canvas }) => {
    // The screen lays out by its width: at the desktop width the state draws M1's sidebar with bridge themes alone and
    // D3's New chat dialog over it, the name typed; at a phone's width the form fills the screen (M11).
    // The open dialog hides the screen behind it from assistive technology, so its roles need `hidden`.
    await expect(canvas.getByRole('heading', { name: 'bridge themes', hidden: true })).toBeVisible()
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'New chat' }))
    const name = dialog.getByRole('textbox', { name: 'NAME · OPTIONAL' })
    await expect(name).toHaveValue('theme tokens')
    await expect(dialog.queryByText('random if blank')).toBeNull()
    await expect(dialog.getByRole('button', { name: 'WORKSPACE: omni-brain' })).toBeVisible()
    await expect(dialog.queryByRole('button', { name: /shell/ })).toBeNull()
    await expectTrapFocus(name)
  },
}
