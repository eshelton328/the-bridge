import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../../../styled-system/css/index.js'
import { ChatEmpty } from './ChatEmpty.tsx'

// A new chat's transcript (R68), as a chat pane gives it: a column of the space above the composer, as wide as the
// phone's chat (390). The short one is that space with the keyboard up.
const phone = css({ display: 'flex', flexDirection: 'column', h: '[600px]', w: '[390px]' })
const short = css({ display: 'flex', flexDirection: 'column', h: '[90px]', w: '[390px]' })

const meta = {
  title: 'Pages/Workspaces/Blocks/ChatEmpty',
  component: ChatEmpty,
  args: { kind: 'claude', title: 'plan the slice', text: 'Send a message to start.' },
} satisfies Meta<typeof ChatEmpty>

export default meta
type Story = StoryObj<typeof meta>

const part = (root: HTMLElement, name: string) => {
  const el = root.querySelector<HTMLElement>(`[data-chat-empty-part="${name}"]`)
  if (el === null) throw new Error(`no ${name}`)
  return el
}
/** Whether the part shows: it lies inside the empty state's box, which clips what wrapped out. */
const shows = (root: HTMLElement, name: string) => {
  const box = root.querySelector('[data-chat-empty]')?.getBoundingClientRect()
  const r = part(root, name).getBoundingClientRect()
  return box !== undefined && r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.bottom <= box.bottom + 0.5
}

/** A new Claude chat on the phone: the mark, the name and the line, centred in the space. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <div className={phone}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('plan the slice')).toBeVisible()
    await expect(canvas.getByText('Send a message to start.')).toBeVisible()
    for (const name of ['mark', 'title', 'line']) await expect(shows(canvasElement, name)).toBe(true)
    const box = canvasElement.querySelector('[data-chat-empty]')?.getBoundingClientRect()
    const mark = part(canvasElement, 'mark').getBoundingClientRect()
    const line = part(canvasElement, 'line').getBoundingClientRect()
    if (box === undefined) throw new Error('no box')
    await expect(Math.abs(mark.left + mark.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(1)
    await expect(Math.abs(mark.top - box.top - (box.bottom - line.bottom))).toBeLessThanOrEqual(2)
  },
}

/** A new Codex chat: its own mark. */
export const Codex: Story = {
  decorators: [
    (Story) => (
      <div className={phone}>
        <Story />
      </div>
    ),
  ],
  args: { kind: 'codex', title: 'drift check' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('drift check')).toBeVisible()
    await expect(part(canvasElement, 'mark').querySelector('svg')).not.toBeNull()
  },
}

/** The space with the keyboard up: too short for the line, so only the mark and the name show. */
export const Keyboard: Story = {
  decorators: [
    (Story) => (
      <div className={short}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(shows(canvasElement, 'mark')).toBe(true)
    await expect(shows(canvasElement, 'title')).toBe(true)
    await expect(shows(canvasElement, 'line')).toBe(false)
  },
}
