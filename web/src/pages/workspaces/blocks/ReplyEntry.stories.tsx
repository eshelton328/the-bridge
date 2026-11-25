import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { css } from '../../../../styled-system/css/index.js'
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

// Chat rich text (2026-11-25): a reply with inline code as a badge and a fenced block as the library's code block,
// with its label, colours, Copy and a long line that scrolls inside it. The code is made up.
const codeReply = {
  ...reply,
  text: [
    'Run `pnpm verify` first, then:',
    '',
    '```ts',
    'const total = sum(2, "sample")',
    `// ${'a made-up note that runs long enough to need sideways room '.repeat(2).trim()}`,
    '```',
  ].join('\n'),
}

/** Checks the code block: its label, its colours once the highlighter loads, and a long line that scrolls in it. */
const codePlay: Story['play'] = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByText('ts', { exact: true })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Copy code' })).toBeVisible()
  const block = canvasElement.querySelector('[data-language="ts"]')
  if (block === null) throw new Error('no code block')
  await waitFor(() => expect(block.querySelector('[data-kind="keyword"]')?.textContent).toBe('const'), {
    timeout: 10_000,
  })
  const body = block.querySelector('pre')
  if (body === null) throw new Error('no code body')
  await expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
  await expect(block.getBoundingClientRect().right).toBeLessThanOrEqual(
    canvasElement.getBoundingClientRect().right + 0.5,
  )
  const inline = canvas.getByText('pnpm verify', { exact: true })
  await expect(getComputedStyle(inline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
}

// A list pane's width, so the long line needs sideways room; each text size story adds its class around it.
const column = css({ w: 'shell.listPane' })

const copyOk = () => Promise.resolve({ ok: true, value: undefined } as const)

// At the Small text size, the size of the Figma frames.
export const CodeSmall: Story = {
  args: { entry: codeReply, onCopy: copyOk },
  decorators: [
    (Story) => (
      <div className={column}>
        <Story />
      </div>
    ),
  ],
  play: codePlay,
}

// At the Default text size (d-131): the larger type wraps the prose; the code stays one line and scrolls.
export const CodeDefault: Story = {
  args: { entry: codeReply, onCopy: copyOk },
  decorators: [
    (Story) => (
      <div className="text-default">
        <div className={column}>
          <Story />
        </div>
      </div>
    ),
  ],
  play: codePlay,
}

// At the Large text size (d-131).
export const CodeLarge: Story = {
  args: { entry: codeReply, onCopy: copyOk },
  decorators: [
    (Story) => (
      <div className="text-large">
        <div className={column}>
          <Story />
        </div>
      </div>
    ),
  ],
  play: codePlay,
}
