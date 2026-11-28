import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { IdeaView } from './IdeaView.tsx'

const words = {
  ideas: 'Ideas',
  noIdeas: 'No ideas yet',
  ideaBack: 'Ideas',
  ideaBackLabel: 'Back to Ideas',
  ideaChat: 'Chat about this idea',
  ideaPage: { makeFeature: 'Make a feature', park: 'Park', questions: 'Open questions' },
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

// The frames (d-135, D09) draw the action card on every idea, so on fixture data, with no `onChat`, the button
// shows as drawn and a press does nothing, as Make a feature and Park do.
export const ChatOnFixtures: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Chat about this idea' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('')
  },
}

export const Questions: Story = {
  args: {
    idea: {
      ...meta.args.idea,
      body: '# Sample idea about speech\n\nTalk to a chat from the phone.\n',
      questions: ['Which engine?'],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Open questions' })).toHaveTextContent('Which engine?')
    // The panel's title is the one heading of that name: the text's own heading went with its list.
    await expect(canvas.getAllByRole('heading', { name: 'Open questions' })).toHaveLength(1)
  },
}
