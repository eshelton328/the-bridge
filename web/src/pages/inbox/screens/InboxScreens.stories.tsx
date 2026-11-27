import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ScreenVariants } from '../../../blocks/ScreenVariants.tsx'
import { frameSizeOf, type Screen, screenStates } from '../../../lib/screenMap.ts'
import { inboxScreens } from '../states/screens.ts'

// One story per Inbox screen (screen review R10): its Desktop, Tablet
// and Phone states side by side, each the state's own story under
// Pages/Inbox/States, at its Figma frame size and one scale. The
// per-state stories keep their play tests; these check the frames only.
const statesTitle = 'Pages/Inbox/States'

const meta = {
  title: 'Pages/Inbox/Screens',
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
        await expect(frames[i]?.dataset.storyId).toBe(`pages-inbox-states--${story}`)
        await expect(frames[i]?.getAttribute('width')).toBe(String(frameSizeOf(screen, device).width))
      }
      // The scaled frames and their gaps fit the row's width.
      const row = canvasElement.firstElementChild
      await expect(row).not.toBeNull()
      await expect(row?.scrollWidth).toBeLessThanOrEqual(row?.clientWidth ?? 0)
    },
  }
}

export const ListScreen: Story = screenStory(inboxScreens.list)
export const NextStepScreen: Story = screenStory(inboxScreens.nextStep)
export const QuestionScreen: Story = screenStory(inboxScreens.question)
export const PromptEditingScreen: Story = screenStory(inboxScreens.promptEditing)
export const RunInScreen: Story = screenStory(inboxScreens.runIn)
export const FilterScreen: Story = screenStory(inboxScreens.filter)
export const StartedScreen: Story = screenStory(inboxScreens.started)
export const RunningScreen: Story = screenStory(inboxScreens.running)
export const ChatScreen: Story = screenStory(inboxScreens.chat)
export const DoneScreen: Story = screenStory(inboxScreens.done)
export const PromptReadScreen: Story = screenStory(inboxScreens.promptRead)
export const SortScreen: Story = screenStory(inboxScreens.sort)
export const SearchScreen: Story = screenStory(inboxScreens.search)
export const SortedByProjectScreen: Story = screenStory(inboxScreens.sortedByProject)
export const SnoozeScreen: Story = screenStory(inboxScreens.snooze)
export const FilteredScreen: Story = screenStory(inboxScreens.filtered)
export const DiscussButtonScreen: Story = screenStory(inboxScreens.discussButton)
export const DiscussionScreen: Story = screenStory(inboxScreens.discussion)
export const ChangeProposedScreen: Story = screenStory(inboxScreens.changeProposed)
export const ChangeAppliedScreen: Story = screenStory(inboxScreens.changeApplied)
export const TasksProposedScreen: Story = screenStory(inboxScreens.tasksProposed)
export const TasksCreatedScreen: Story = screenStory(inboxScreens.tasksCreated)
export const RemovalProposedScreen: Story = screenStory(inboxScreens.removalProposed)
export const RemoveConfirmScreen: Story = screenStory(inboxScreens.removeConfirm)
export const RemovedScreen: Story = screenStory(inboxScreens.removed)
