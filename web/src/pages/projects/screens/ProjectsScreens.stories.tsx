import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ScreenVariants } from '../../../blocks/ScreenVariants.tsx'
import { frameSizeOf, type Screen, screenStates } from '../../../lib/screenMap.ts'
import { projectsScreens } from '../states/screens.ts'

// One story per Projects screen (screen review R10): its Desktop, Tablet
// and Phone states side by side, each the state's own story under
// Pages/Projects/States, at its Figma frame size and one scale. The
// per-state stories keep their play tests; these check the frames only.
const statesTitle = 'Pages/Projects/States'

const meta = {
  title: 'Pages/Projects/Screens',
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
        await expect(frames[i]?.dataset.storyId).toBe(`pages-projects-states--${story}`)
        await expect(frames[i]?.getAttribute('width')).toBe(String(frameSizeOf(screen, device).width))
      }
      // The scaled frames and their gaps fit the row's width.
      const row = canvasElement.firstElementChild
      await expect(row).not.toBeNull()
      await expect(row?.scrollWidth).toBeLessThanOrEqual(row?.clientWidth ?? 0)
    },
  }
}

export const HomeScreen: Story = screenStory(projectsScreens.home)
