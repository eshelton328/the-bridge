import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { IdeaView } from './IdeaView.tsx'

const words = {
  ideas: 'Ideas',
  noIdeas: 'No ideas yet',
  ideaBack: 'Ideas',
  ideaBackLabel: 'Back to Ideas',
  ideaKinds: { idea: 'Idea', proposal: 'Proposal', audit: 'Audit' },
  ideaStates: {
    open: 'Open',
    'in-design': 'In design',
    'needs-you': 'Needs you',
    decided: 'Decided',
    parked: 'Parked',
  },
}

const meta = {
  title: 'Pages/Projects/Blocks/IdeaView',
  component: IdeaView,
  args: {
    words,
    onBack: fn(),
    idea: {
      row: {
        id: 'sample-1',
        title: 'Sample idea about speech',
        tags: [],
        kind: 'proposal',
        state: 'open',
        age: '2d',
      },
      body: '# Sample idea about speech\n\nTalk to a chat from the phone.\n\n## Open questions\n\n- Which engine?\n',
    },
  },
} satisfies Meta<typeof IdeaView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('heading', { name: 'Sample idea about speech' })).toBeVisible()
    await expect(canvas.getAllByRole('heading', { name: 'Sample idea about speech' })).toHaveLength(1)
    await expect(canvas.getByText('Which engine?')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Back to Ideas' }))
    await expect(args.onBack).toHaveBeenCalled()
  },
}
