import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen } from 'storybook/test'
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
  ideaTools: {
    search: 'Search ideas',
    sort: 'Sort by',
    sorts: { updated: 'Updated', title: 'Idea', kind: 'Kind', state: 'State' },
    noMatch: 'No idea matches',
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

const three: IdeaRow[] = [
  row,
  { ...row, id: 'sample-2', title: 'Another idea about tags', tags: [], kind: 'proposal', state: 'open' },
  { ...row, id: 'sample-3', title: 'Bridge audit of the library', tags: ['audit'], kind: 'audit', state: 'parked' },
]
const titles = (canvas: { getAllByRole: (role: 'listitem') => HTMLElement[] }) =>
  canvas.getAllByRole('listitem').map((li) => li.textContent.split(/Idea|Proposal|Audit/)[0])

export const Sorted: Story = {
  args: { ideas: { rows: three } },
  play: async ({ canvas, userEvent }) => {
    await expect(titles(canvas)).toEqual([
      'Sample idea about speech',
      'Another idea about tags',
      'Bridge audit of the library',
    ])
    await userEvent.click(canvas.getByRole('button', { name: /Sort by/ }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Idea' }))
    await expect(titles(canvas)).toEqual([
      'Another idea about tags',
      'Bridge audit of the library',
      'Sample idea about speech',
    ])
  },
}

export const Searched: Story = {
  args: { ideas: { rows: three } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search ideas' }), 'parked')
    await expect(canvas.getAllByRole('listitem')).toHaveLength(1)
    await expect(canvas.getByText('Bridge audit of the library')).toBeVisible()
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search ideas' }), ' nothing')
    await expect(canvas.getByText('No idea matches')).toBeVisible()
  },
}
