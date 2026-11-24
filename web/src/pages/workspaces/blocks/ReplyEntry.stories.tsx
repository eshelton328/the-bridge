import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ReplyEntry } from './ReplyEntry.tsx'

// A live reply, as `chatEntryOf` maps it; the text is made up. Figma draws no rewritten reply (R62).
const reply = {
  type: 'assistant',
  id: 'a-2',
  kind: 'claude',
  name: 'Claude',
  text: 'The build passes. Three checks ran: **types**, lint and the unit suite.',
  copy: 'Copy',
} as const

const meta = {
  title: 'Pages/Workspaces/Blocks/ReplyEntry',
  component: ReplyEntry,
} satisfies Meta<typeof ReplyEntry>

export default meta
type Story = StoryObj<typeof meta>

// A reply with Copy and no note.
export const Default: Story = {
  args: { entry: reply },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Reply rewritten' })).toBeNull()
  },
}

// A reply that a Stop hook had written again (R62): the note beside Copy; a tap shows the draft under the reply.
export const Rewritten: Story = {
  args: {
    entry: {
      ...reply,
      rewritten: {
        label: 'Reply rewritten',
        drafts: [{ id: 'a-1', name: 'Draft', text: 'The build passes. Four checks ran, and one of them twice.' }],
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const note = canvas.getByRole('button', { name: 'Reply rewritten' })
    await expect(note).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText(/Four checks ran/)).toBeNull()
    await userEvent.click(note)
    await expect(note).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('group', { name: 'Reply rewritten' })).toBeVisible()
    await expect(canvas.getByText(/Four checks ran/)).toBeVisible()
  },
}

// Two rejections in a row: the reply carries both drafts, oldest first, open.
export const TwoDrafts: Story = {
  args: {
    entry: {
      ...reply,
      rewritten: {
        label: 'Reply rewritten',
        drafts: [
          { id: 'a-0', name: 'Draft', text: 'The build passes. Four checks ran, and one of them twice.' },
          {
            id: 'a-1',
            name: 'Draft',
            text: 'The build passes. Three checks ran.',
            cut: 'Cut — full text not live yet',
          },
        ],
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reply rewritten' }))
    const drafts = canvas.getByRole('group', { name: 'Reply rewritten' })
    await expect(drafts.querySelectorAll('article')).toHaveLength(2)
    await expect(drafts).toHaveTextContent(/Four checks ran.*Three checks ran\..*Cut — full text not live yet/)
  },
}
