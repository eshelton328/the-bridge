import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../../../styled-system/css/index.js'
import { TranscriptSkeleton } from './TranscriptSkeleton.tsx'

// A transcript's place, as a chat pane gives it: a column of a fixed height that the skeleton fills (R64), as wide as
// the phone's chat (390) or the tablet's (744).
const phone = css({ display: 'flex', flexDirection: 'column', h: '[600px]', w: '[390px]' })
const tablet = css({ display: 'flex', flexDirection: 'column', h: '[900px]', w: '[744px]' })

const meta = {
  title: 'Pages/Workspaces/Blocks/TranscriptSkeleton',
  component: TranscriptSkeleton,
  args: { label: 'Loading this chat', gap: '' },
} satisfies Meta<typeof TranscriptSkeleton>

export default meta
type Story = StoryObj<typeof meta>

const check: Story['play'] = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByRole('status', { name: 'Loading this chat' })).toBeInTheDocument()
  const frame = canvas.getByTestId('pane').getBoundingClientRect()
  const rows = [...canvasElement.querySelectorAll('[data-skeleton-entry]')]
  const edge = rows[0]?.parentElement?.getBoundingClientRect().right ?? Number.NaN
  const shown = rows.filter((row) => row.getBoundingClientRect().left < edge)
  const rects = shown.map((row) => row.getBoundingClientRect())
  // The entries that show fill the pane: the first at its top, the last whole one at its bottom (R64).
  await expect(shown.length).toBeGreaterThanOrEqual(2)
  await expect(Math.abs((rects[0]?.top ?? Number.NaN) - frame.top)).toBeLessThanOrEqual(2)
  await expect(Math.abs((rects.at(-1)?.bottom ?? Number.NaN) - frame.bottom)).toBeLessThanOrEqual(2)
  // The ones that do not fit are past the edge, clipped.
  await expect(shown.length).toBeLessThan(rows.length)
  // R65: no real name heads a reply, and no two replies or bubbles in view draw the same lines.
  await expect(canvasElement.textContent).not.toMatch(/Claude|Codex|Shell/)
  const shapes = (from: string) =>
    shown
      .filter((row) => row.getAttribute('data-skeleton-entry') === from)
      .map((row) =>
        [...row.querySelectorAll('[data-skeleton="line"]')]
          .map((line) => Math.round(line.getBoundingClientRect().width))
          .join(','),
      )
  for (const from of ['user', 'assistant']) {
    const seen = shapes(from)
    for (let i = 1; i < seen.length; i++) await expect(seen[i]).not.toBe(seen[i - 1])
  }
  // A reply has 2 to 5 lines under its author row.
  for (const row of shown.filter((r) => r.getAttribute('data-skeleton-entry') === 'assistant')) {
    const lines = row.querySelectorAll('[data-skeleton="line"]').length - 1
    await expect(lines).toBeGreaterThanOrEqual(2)
    await expect(lines).toBeLessThanOrEqual(5)
  }
}

/** A chat that loads on the phone: the owner's bubbles and replies of different lengths in turn, top to bottom. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <div className={phone} data-testid="pane">
        <Story />
      </div>
    ),
  ],
  play: check,
}

/** The same at the tablet's width. */
export const Tablet: Story = {
  decorators: [
    (Story) => (
      <div className={tablet} data-testid="pane">
        <Story />
      </div>
    ),
  ],
  play: check,
}
