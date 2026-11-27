import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ScreenVariants } from '../../../blocks/ScreenVariants.tsx'
import { frameSizeOf, type Screen, screenStates } from '../../../lib/screenMap.ts'
import { toolkitScreens } from '../states/screens.ts'

// One story per Toolkit screen (screen review R10): its Desktop, Tablet
// and Phone states side by side, each the state's own story under
// Pages/Toolkit/States, at its Figma frame size and one scale. The
// per-state stories keep their play tests; these check the frames only.
const statesTitle = 'Pages/Toolkit/States'

const meta = {
  title: 'Pages/Toolkit/Screens',
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
        await expect(frames[i]?.dataset.storyId).toBe(`pages-toolkit-states--${story}`)
        await expect(frames[i]?.getAttribute('width')).toBe(String(frameSizeOf(screen, device).width))
      }
      // The scaled frames and their gaps fit the row's width.
      const row = canvasElement.firstElementChild
      await expect(row).not.toBeNull()
      await expect(row?.scrollWidth).toBeLessThanOrEqual(row?.clientWidth ?? 0)
    },
  }
}

export const ListScreen: Story = screenStory(toolkitScreens.list)
export const MapScreen: Story = screenStory(toolkitScreens.map)
export const MoreScreen: Story = screenStory(toolkitScreens.more)
export const SkillOverviewScreen: Story = screenStory(toolkitScreens.skillOverview)
export const RuleOverviewScreen: Story = screenStory(toolkitScreens.ruleOverview)
export const AgentOverviewScreen: Story = screenStory(toolkitScreens.agentOverview)
export const HookOverviewScreen: Story = screenStory(toolkitScreens.hookOverview)
export const WorkflowOverviewScreen: Story = screenStory(toolkitScreens.workflowOverview)
export const SkillHowItWorksScreen: Story = screenStory(toolkitScreens.skillHowItWorks)
export const RuleHowItWorksScreen: Story = screenStory(toolkitScreens.ruleHowItWorks)
export const AgentHowItWorksScreen: Story = screenStory(toolkitScreens.agentHowItWorks)
export const HookHowItWorksScreen: Story = screenStory(toolkitScreens.hookHowItWorks)
export const WorkflowPageScreen: Story = screenStory(toolkitScreens.workflowPage)
export const SkillFilesScreen: Story = screenStory(toolkitScreens.skillFiles)
export const RuleFilesScreen: Story = screenStory(toolkitScreens.ruleFiles)
export const AgentFilesScreen: Story = screenStory(toolkitScreens.agentFiles)
export const WorkflowFilesScreen: Story = screenStory(toolkitScreens.workflowFiles)
export const HookFilesScreen: Story = screenStory(toolkitScreens.hookFiles)
export const ScriptExplainedScreen: Story = screenStory(toolkitScreens.scriptExplained)
export const ScriptCodeScreen: Story = screenStory(toolkitScreens.scriptCode)
export const SkillLinksScreen: Story = screenStory(toolkitScreens.skillLinks)
export const RuleLinksScreen: Story = screenStory(toolkitScreens.ruleLinks)
export const AgentLinksScreen: Story = screenStory(toolkitScreens.agentLinks)
export const WorkflowLinksScreen: Story = screenStory(toolkitScreens.workflowLinks)
export const HookLinksScreen: Story = screenStory(toolkitScreens.hookLinks)
export const SkillEvalsScreen: Story = screenStory(toolkitScreens.skillEvals)
export const RuleEvalsScreen: Story = screenStory(toolkitScreens.ruleEvals)
export const AgentEvalsScreen: Story = screenStory(toolkitScreens.agentEvals)
export const WorkflowEvalsScreen: Story = screenStory(toolkitScreens.workflowEvals)
export const HookEvalsScreen: Story = screenStory(toolkitScreens.hookEvals)
export const SkillActivityScreen: Story = screenStory(toolkitScreens.skillActivity)
export const RuleActivityScreen: Story = screenStory(toolkitScreens.ruleActivity)
export const AgentActivityScreen: Story = screenStory(toolkitScreens.agentActivity)
export const WorkflowActivityScreen: Story = screenStory(toolkitScreens.workflowActivity)
export const HookActivityScreen: Story = screenStory(toolkitScreens.hookActivity)
export const DiscussScreen: Story = screenStory(toolkitScreens.discuss)
export const ActivityViewScreen: Story = screenStory(toolkitScreens.activityView)
export const ActivityRunScreen: Story = screenStory(toolkitScreens.activityRun)
export const ActivityChatsScreen: Story = screenStory(toolkitScreens.activityChats)
export const ActivityHeadlessScreen: Story = screenStory(toolkitScreens.activityHeadless)
export const ActivityChatScreen: Story = screenStory(toolkitScreens.activityChat)
