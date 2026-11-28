import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { IdeaView } from './IdeaView.tsx'

const words = {
  ideas: 'Ideas',
  noIdeas: 'No ideas yet',
  ideaBack: 'Ideas',
  ideaBackLabel: 'Back to Ideas',
  ideaChat: 'Chat about this idea',
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
      file: 'ideas/sample-idea.md',
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

export const LinksAndLists: Story = {
  args: { idea: { ...meta.args.idea, body: 'See [the spec](https://example.com/spec).\n\n- First point\n' } },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'the spec' })
    await expect(getComputedStyle(link).textDecorationLine).toContain('underline')
    const item = canvas.getByText('First point').closest('li')
    await expect(item === null ? 'none' : getComputedStyle(item).listStyleType).not.toBe('none')
  },
}

export const EmptyFirstHeading: Story = {
  args: { idea: { ...meta.args.idea, body: '#\nThe line under an empty heading.\n' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('The line under an empty heading.')).toBeVisible()
  },
}

export const Chat: Story = {
  args: { onChat: fn() },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('')
    await userEvent.click(canvas.getByRole('button', { name: 'Chat about this idea' }))
    await expect(args.onChat).toHaveBeenCalledOnce()
  },
}

export const ChatMissed: Story = {
  args: { onChat: fn(), chat: { line: 'This chat needs you on the Mac', retry: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('This chat needs you on the Mac')
  },
}

export const ChatBusy: Story = {
  args: { onChat: fn(), chat: { busy: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Chat about this idea' })).toBeDisabled()
  },
}

export const NoChat: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Chat about this idea' })).toBeNull()
  },
}
