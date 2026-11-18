import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ScreenVariants } from '../../../blocks/ScreenVariants.tsx'
import { frameSizes, type Screen, screenStates } from '../../../lib/screenMap.ts'
import { artifactsScreens } from '../states/screens.ts'

// One story per Artifacts screen (screen review R10): its Desktop, Tablet
// and Phone states side by side, each the state's own story under
// Pages/Artifacts/States, at its Figma frame size and one scale. The
// per-state stories keep their play tests; these check the frames only.
const statesTitle = 'Pages/Artifacts/States'

const meta = {
  title: 'Pages/Artifacts/Screens',
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
        await expect(frames[i]?.dataset.storyId).toBe(`pages-artifacts-states--${story}`)
        await expect(frames[i]?.getAttribute('width')).toBe(String(frameSizes[device].width))
      }
      // The scaled frames and their gaps fit the row's width.
      const row = canvasElement.firstElementChild
      await expect(row).not.toBeNull()
      await expect(row?.scrollWidth).toBeLessThanOrEqual(row?.clientWidth ?? 0)
    },
  }
}

export const LibraryScreen: Story = screenStory(artifactsScreens.library)
export const ArtifactScreen: Story = screenStory(artifactsScreens.artifact)
export const FilterScreen: Story = screenStory(artifactsScreens.filter)
export const SortScreen: Story = screenStory(artifactsScreens.sort)
export const SearchScreen: Story = screenStory(artifactsScreens.search)
export const AddLinkScreen: Story = screenStory(artifactsScreens.addLink)
export const DiscussionScreen: Story = screenStory(artifactsScreens.discussion)
export const ChangeProposedScreen: Story = screenStory(artifactsScreens.changeProposed)
export const ChangeAppliedScreen: Story = screenStory(artifactsScreens.changeApplied)
export const FileInProjectScreen: Story = screenStory(artifactsScreens.fileInProject)
export const MoreScreen: Story = screenStory(artifactsScreens.more)
