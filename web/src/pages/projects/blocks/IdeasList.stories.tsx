import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import type { IdeaRow } from '../types.ts'
import { IdeasList } from './IdeasList.tsx'

const words = {
  ideas: 'Ideas',
  noIdeas: 'No ideas yet',
  ideaKinds: { idea: 'Idea', proposal: 'Proposal', audit: 'Audit' },
  ideaStates: {
    open: 'Open',
    'in-design': 'In design',
    'needs-you': 'Needs you',
    decided: 'Decided',
    parked: 'Parked',
  },
}
const row: IdeaRow = {
  id: 'sample-1',
  title: 'Sample idea about speech',
  tags: ['voice'],
  kind: 'idea',
  state: 'in-design',
  age: '2d',
}

const meta = {
  title: 'Pages/Projects/Blocks/IdeasList',
  component: IdeasList,
  args: { words, layout: 'desktop', onOpen: fn(), ideas: { rows: [row] } },
} satisfies Meta<typeof IdeasList>

export default meta
type Story = StoryObj<typeof meta>

export const Rows: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('Sample idea about speech')).toBeVisible()
    await expect(canvas.getByText('Idea · In design · voice')).toBeVisible()
    await userEvent.click(canvas.getByText('Sample idea about speech'))
    await expect(args.onOpen).toHaveBeenCalledWith('sample-1')
  },
}

export const Empty: Story = {
  args: { ideas: { rows: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No ideas yet')).toBeVisible()
  },
}

export const NotRead: Story = {
  args: { ideas: { rows: [], notRead: 'Ideas not read — the server answered 500' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Ideas not read — the server answered 500')
  },
}
