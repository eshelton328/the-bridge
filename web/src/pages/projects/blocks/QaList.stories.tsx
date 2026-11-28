import type { QaItem } from '@bridge/contract'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { QaList } from './QaList.tsx'

const words = {
  qaGroups: { beforeMerge: 'Before merge', afterMerge: 'After merge' },
  noQa: 'Nothing waits for your check',
  qaStatuses: {
    waiting: 'Waiting',
    changesRequested: 'Changes requested',
    ciFailing: 'CI failing',
    approved: 'Approved',
  },
  qaWorktrees: {
    stopped: 'Stopped',
    starting: 'Starting',
    running: 'Running',
    failed: 'Failed',
    servedApp: 'Served app',
  },
}
const item = {
  comments: 0,
  askedAt: '2026-11-27T10:00:00.000Z',
  launch: { url: null, blocked: null },
} as const
const rows: QaItem[] = [
  {
    ...item,
    issue: 'NCC-7',
    title: 'Sample work that waits for a check',
    phase: 'beforeMerge',
    repository: 'example-app',
    pr: 12,
    status: 'waiting',
    worktree: 'stopped',
    issueUrl: 'https://linear.app/example/issue/NCC-7',
  },
  {
    ...item,
    issue: 'NCC-3',
    title: 'Sample work on the served app',
    phase: 'afterMerge',
    repository: null,
    pr: null,
    status: 'changesRequested',
    worktree: 'servedApp',
    issueUrl: 'https://linear.app/example/issue/NCC-3',
  },
]

const meta = {
  title: 'Pages/Projects/Blocks/QaList',
  component: QaList,
  args: { words, layout: 'desktop', qa: { rows } },
} satisfies Meta<typeof QaList>

export default meta
type Story = StoryObj<typeof meta>

export const Groups: Story = {
  play: async ({ canvas }) => {
    const before = canvas.getByRole('list', { name: 'Before merge' })
    await expect(before).toHaveTextContent('Sample work that waits for a check')
    await expect(canvas.getByText('NCC-7 · example-app#12')).toBeVisible()
    await expect(canvas.getByText('Waiting · Stopped')).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'After merge' })).toHaveTextContent('Sample work on the served app')
    await expect(canvas.getByText('Changes requested · Served app')).toBeVisible()
  },
}

/** The phone puts the status and the worktree after the meta, as the Repositories tab puts its counts. */
export const Phone: Story = {
  args: { layout: 'phone' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('NCC-7 · example-app#12 · Waiting · Stopped')).toBeVisible()
    await expect(canvas.getByText('NCC-3 · Changes requested · Served app')).toBeVisible()
  },
}

/** A group with no item is not drawn. */
export const OneGroup: Story = {
  args: { qa: { rows: rows.slice(1) } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list', { name: 'Before merge' })).toBeNull()
    await expect(canvas.getByRole('list', { name: 'After merge' })).toBeVisible()
  },
}

export const Empty: Story = {
  args: { qa: { rows: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Nothing waits for your check')).toBeVisible()
  },
}

export const NotRead: Story = {
  args: { qa: { rows: [], notRead: 'QA items not read — the server answered 503' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('QA items not read — the server answered 503')
  },
}
