import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../../../styled-system/css/index.js'
import { TranscriptSkeleton } from './TranscriptSkeleton.tsx'

// A transcript's place, as a chat pane gives it: a column of a fixed height that the skeleton fills (R64).
const pane = css({ display: 'flex', flexDirection: 'column', h: '[600px]' })

const meta = {
  title: 'Pages/Workspaces/Blocks/TranscriptSkeleton',
  component: TranscriptSkeleton,
  decorators: [
    (Story) => (
      <div className={pane} data-testid="pane">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TranscriptSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A Claude chat that loads: the owner's bubble and a reply's lines in turn, as many as fit, from the pane's top to its
 * bottom.
 */
export const Claude: Story = {
  args: { label: 'Loading this chat', kind: 'claude', gap: '' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('status', { name: 'Loading this chat' })).toBeInTheDocument()
    const frame = canvas.getByTestId('pane').getBoundingClientRect()
    const rows = [...canvasElement.querySelectorAll('[data-skeleton="transcript-entry"]')]
    const edge = rows[0]?.parentElement?.getBoundingClientRect().right ?? Number.NaN
    const shown = rows.map((row) => row.getBoundingClientRect()).filter((rect) => rect.left < edge)
    // The entries that show fill the pane: the first at its top, the last whole one at its bottom.
    await expect(shown.length).toBeGreaterThanOrEqual(2)
    await expect(Math.abs((shown[0]?.top ?? Number.NaN) - frame.top)).toBeLessThanOrEqual(2)
    await expect(Math.abs((shown.at(-1)?.bottom ?? Number.NaN) - frame.bottom)).toBeLessThanOrEqual(2)
    // The ones that do not fit are past the edge, clipped.
    await expect(shown.length).toBeLessThan(rows.length)
  },
}
