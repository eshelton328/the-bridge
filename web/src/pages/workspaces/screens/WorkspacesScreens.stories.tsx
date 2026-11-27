import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ScreenVariants } from '../../../blocks/ScreenVariants.tsx'
import { frameSizeOf, type Screen, screenStates } from '../../../lib/screenMap.ts'
import { workspacesScreens } from '../states/screens.ts'

// One story per Workspaces screen (screen review R10): its Desktop, Tablet
// and Phone states side by side, each the state's own story under
// Pages/Workspaces/States, at its Figma frame size and one scale. The
// per-state stories keep their play tests; these check the frames only.
const statesTitle = 'Pages/Workspaces/States'

const meta = {
  title: 'Pages/Workspaces/Screens',
  component: ScreenVariants,
  args: { statesTitle, mode: 'dark' },
} satisfies Meta<typeof ScreenVariants>

export default meta
type Story = StoryObj<typeof meta>

function screenStory(screen: Screen<string>): Story {
  return {
    name: screen.title,
    args: { screen },
    render: (args, { globals }) => <ScreenVariants {...args} mode={globals.mode === 'light' ? 'light' : 'dark'} />,
    play: async ({ canvasElement }) => {
      const frames = [...canvasElement.querySelectorAll('iframe')]
      const expected = screenStates(screen)
      await expect(frames).toHaveLength(expected.length)
      for (const [i, { device, state }] of expected.entries()) {
        const story = state.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
        await expect(frames[i]?.dataset.storyId).toBe(`pages-workspaces-states--${story}`)
        await expect(frames[i]?.getAttribute('width')).toBe(String(frameSizeOf(screen, device).width))
      }
      // The scaled frames and their gaps fit the row's width.
      const row = canvasElement.firstElementChild
      await expect(row).not.toBeNull()
      await expect(row?.scrollWidth).toBeLessThanOrEqual(row?.clientWidth ?? 0)
    },
  }
}

export const WorkbenchScreen: Story = screenStory(workspacesScreens.workbench)
export const SideChatScreen: Story = screenStory(workspacesScreens.sideChat)
export const ChatActionsScreen: Story = screenStory(workspacesScreens.chatActions)
export const NewChatScreen: Story = screenStory(workspacesScreens.newChat)
export const FoldersScreen: Story = screenStory(workspacesScreens.folders)
export const SideChatInPaneScreen: Story = screenStory(workspacesScreens.sideChatInPane)
export const DragIntoPaneScreen: Story = screenStory(workspacesScreens.dragIntoPane)
export const OpenChatScreen: Story = screenStory(workspacesScreens.openChat)
export const DragOverPaneScreen: Story = screenStory(workspacesScreens.dragOverPane)
export const TwoPanesScreen: Story = screenStory(workspacesScreens.twoPanes)
export const DragBelowPaneScreen: Story = screenStory(workspacesScreens.dragBelowPane)
export const ThreePanesScreen: Story = screenStory(workspacesScreens.threePanes)
export const FourPanesScreen: Story = screenStory(workspacesScreens.fourPanes)
export const EmptiedPaneScreen: Story = screenStory(workspacesScreens.emptiedPane)
export const ResizedPanesScreen: Story = screenStory(workspacesScreens.resizedPanes)
export const ForkScreen: Story = screenStory(workspacesScreens.fork)
export const ForkedChatScreen: Story = screenStory(workspacesScreens.forkedChat)
export const SubtaskScreen: Story = screenStory(workspacesScreens.subtask)
export const SubtaskRunningScreen: Story = screenStory(workspacesScreens.subtaskRunning)
export const MoveToWorkspaceScreen: Story = screenStory(workspacesScreens.moveToWorkspace)
export const MovedChatScreen: Story = screenStory(workspacesScreens.movedChat)
export const RenameChatScreen: Story = screenStory(workspacesScreens.renameChat)
export const WorkspaceListScreen: Story = screenStory(workspacesScreens.workspaceList)
export const EditModeScreen: Story = screenStory(workspacesScreens.editMode)
export const SkillsScreen: Story = screenStory(workspacesScreens.skills)
export const SubagentsScreen: Story = screenStory(workspacesScreens.subagents)
export const HoldChatScreen: Story = screenStory(workspacesScreens.holdChat)
export const KeyboardScreen: Story = screenStory(workspacesScreens.keyboard)
export const NewChatKeyboardScreen: Story = screenStory(workspacesScreens.newChatKeyboard)
export const SubagentTranscriptScreen: Story = screenStory(workspacesScreens.subagentTranscript)
export const CloseWorkspaceScreen: Story = screenStory(workspacesScreens.closeWorkspace)
export const WorkspaceActionsScreen: Story = screenStory(workspacesScreens.workspaceActions)
export const AddMenuScreen: Story = screenStory(workspacesScreens.addMenu)
export const TapChatScreen: Story = screenStory(workspacesScreens.tapChat)
