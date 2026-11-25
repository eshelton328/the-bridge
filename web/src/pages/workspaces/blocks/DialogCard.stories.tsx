import type { PaneDialog } from '@bridge/contract'
import { textSizeClass, type TextSize } from '@eshelton328/component-library-1701'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, type ReactNode, useLayoutEffect, useState } from 'react'
import { expect, fn } from 'storybook/test'
import { css } from '../../../../styled-system/css/index.js'
import { DialogCard } from './DialogCard.tsx'

// R69, restyled in R72: a terminal dialog that the transcript does not hold, drawn after a blocked chat's entries.
// Made-up values.
const dialog = {
  id: 'a1b2c3d4e5f60718',
  title: 'Sample step',
  body: 'Goal: tidy the notes\nSteps: sort, merge\nSend this to the chat?',
  options: [
    { n: 1, label: 'Send structured' },
    { n: 2, label: 'Send original' },
  ],
  raw: 'Sample step\nGoal: tidy the notes',
} satisfies PaneDialog
const withDetail = {
  id: 'b1b2c3d4e5f60718',
  title: 'Card colour',
  body: 'Which colour for the sample card?',
  options: [
    { n: 1, label: 'Red', detail: 'A warm accent that reads as a warning' },
    { n: 2, label: 'Blue', detail: 'The calm accent the other cards use' },
  ],
  raw: 'Card colour\nWhich colour for the sample card?',
} satisfies PaneDialog
const longLabel = {
  id: 'c1b2c3d4e5f60718',
  body: 'How should the notes go to the chat?',
  options: [
    { n: 1, label: 'Send structured' },
    {
      n: 2,
      label: 'Send original — the notes as typed, with every line and heading kept in the order they were written',
    },
  ],
  raw: 'How should the notes go to the chat?',
} satisfies PaneDialog
const sixOptions = {
  id: 'd1b2c3d4e5f60718',
  title: 'Pick a branch',
  body: 'Which branch should the sample run use?',
  options: [
    { n: 1, label: 'main', detail: 'The default branch' },
    { n: 2, label: 'sample-one' },
    { n: 3, label: 'sample-two', detail: 'Two commits ahead of main' },
    { n: 4, label: 'sample-three' },
    { n: 5, label: 'sample-four' },
    { n: 6, label: 'sample-five', detail: 'Last pushed a week ago' },
  ],
  raw: 'Pick a branch',
} satisfies PaneDialog
const rawOnly: PaneDialog = {
  id: 'e1b2c3d4e5f60718',
  raw: Array.from({ length: 40 }, (_, i) => `line ${String(i + 1)} of a sample menu`).join('\n'),
}

// The card in a transcript-wide column with the page's side gutter.
const column = css({ p: '16', maxW: 'shell.thread' })
const inColumn: Decorator = (Story) => (
  <div className={column}>
    <Story />
  </div>
)

const meta = {
  title: 'Pages/Workspaces/Blocks/DialogCard',
  component: DialogCard,
  decorators: [inColumn],
  args: { view: { dialog, phase: 'ready' }, onAnswer: fn(), onRetry: fn() },
} satisfies Meta<typeof DialogCard>

export default meta
type Story = StoryObj<typeof meta>
type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas']

const card = (canvas: Canvas) => canvas.getByRole('group', { name: 'Waiting for your answer' })
const send = (canvas: Canvas) => canvas.getByRole('button', { name: 'Send answer' })

// A row chosen, then Send answer sends its number; a tap alone sends nothing.
export const Dark: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(card(canvas)).toHaveTextContent('Sample step')
    await expect(send(canvas)).toBeDisabled()
    await userEvent.click(canvas.getByRole('radio', { name: 'Send original' }))
    await expect(args.onAnswer).not.toHaveBeenCalled()
    await expect(canvas.getByRole('radio', { name: 'Send original' })).toBeChecked()
    await userEvent.click(send(canvas))
    await expect(args.onAnswer).toHaveBeenCalledWith(2)
    await expect(args.onAnswer).toHaveBeenCalledOnce()
  },
}
export const Light: Story = { ...Dark, globals: { mode: 'light' } }

// Each option's detail as a muted second line under its label; the title differs from the question, so it shows.
export const Detail: Story = {
  args: { view: { dialog: withDetail, phase: 'ready' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Red' })).toHaveAccessibleDescription(
      'A warm accent that reads as a warning',
    )
    await expect(card(canvas)).toHaveTextContent('Card colour')
    await expect(card(canvas)).not.toHaveTextContent('Red — Red')
  },
}
export const DetailLight: Story = { ...Detail, globals: { mode: 'light' } }

// An option with a description and one without (#518): the description shows under its label, in the row.
export const Details: Story = {
  args: {
    view: {
      dialog: {
        ...dialog,
        options: [
          { n: 1, label: 'Red', detail: 'Use red for marker-5150.' },
          { n: 2, label: 'Green' },
        ],
      },
      phase: 'ready',
    },
  },
  play: async ({ canvas }) => {
    const red = canvas.getByRole('radio', { name: 'Red' })
    await expect(red).toHaveAccessibleDescription('Use red for marker-5150.')
    await expect(red.closest('label')).toHaveTextContent('Use red for marker-5150.')
    await expect(canvas.getByText('Use red for marker-5150.')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: 'Green' })).not.toHaveAccessibleDescription()
  },
}

// A description the terminal wrapped over several lines comes as one text (#518); the row wraps it and shows every
// word, with nothing cut.
const wrappedDetail =
  'Never deploy to production without approval from the release owner, and keep the change log for each step'
export const WrappedDetail: Story = {
  args: {
    view: {
      dialog: {
        ...dialog,
        options: [
          { n: 1, label: 'Production', detail: wrappedDetail },
          { n: 2, label: 'Staging' },
        ],
      },
      phase: 'ready',
    },
  },
  play: async ({ canvas }) => {
    const text = canvas.getByText(wrappedDetail)
    await expect(text).toBeVisible()
    await expect(text.scrollHeight).toBeLessThanOrEqual(text.clientHeight)
    await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth)
    const row = canvas.getByRole('radio', { name: 'Production' }).closest('label')
    if (row === null) throw new Error('no row')
    await expect(row.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(text.getBoundingClientRect().bottom)
  },
}

// A dialog whose title is its question shows the question once.
export const SameTitle: Story = {
  args: { view: { dialog: { ...dialog, title: 'Pick one', body: 'Pick one' }, phase: 'ready' } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('Pick one')).toHaveLength(1)
  },
}

// A long label wraps in its row, inside the card.
export const LongLabel: Story = {
  args: { view: { dialog: longLabel, phase: 'ready' } },
  play: async ({ canvas }) => {
    const box = card(canvas).getBoundingClientRect()
    for (const radio of canvas.getAllByRole('radio')) {
      const row = radio.closest('label') ?? radio
      await expect(row.getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
    }
  },
}

// Six options, each a row at least 44 high.
export const SixOptions: Story = {
  args: { view: { dialog: sixOptions, phase: 'ready' } },
  play: async ({ canvas }) => {
    const radios = canvas.getAllByRole('radio')
    await expect(radios).toHaveLength(6)
    for (const radio of radios)
      await expect((radio.closest('label') ?? radio).getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  },
}
export const SixOptionsLight: Story = { ...SixOptions, globals: { mode: 'light' } }

// A chosen row, before Send answer.
export const Selected: Story = {
  args: { view: { dialog: withDetail, phase: 'ready' } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Blue' }))
    await expect(send(canvas)).toBeEnabled()
  },
}
export const SelectedLight: Story = { ...Selected, globals: { mode: 'light' } }

// The answer goes: the rows and the button are off.
export const Sending: Story = {
  args: { view: { dialog, phase: 'sending' } },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Sending…' })).toBeDisabled()
  },
}

// The server took the answer.
export const Sent: Story = {
  args: { view: { dialog, phase: 'sent' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Sent' })).toBeDisabled()
  },
}

// The server answered 409: the terminal shows another dialog now.
export const Changed: Story = {
  args: { view: { dialog, phase: 'changed' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('The terminal changed — showing the new state')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: 'Send structured' })).toBeDisabled()
  },
}

// The answer missed: a line with Retry.
export const Failed: Story = {
  render: (args) => <FailsOnSend {...args} />,
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Send original' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Send answer' }))
    await expect(canvas.getByText('Not sent — herdr-unavailable')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: 'Send original' })).toBeChecked()
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
    // Another row chosen: Retry would send the old answer, so it goes.
    await userEvent.click(canvas.getByRole('radio', { name: 'Send structured' }))
    await expect(canvas.queryByRole('button', { name: 'Retry' })).toBeNull()
  },
}
export const FailedLight: Story = { ...Failed, globals: { mode: 'light' } }

/** The card whose Send answer misses at once: its view goes to `failed`, with Retry, as a 503 leaves it. */
function FailsOnSend(props: ComponentProps<typeof DialogCard>) {
  const [view, setView] = useState(props.view)
  return (
    <DialogCard
      {...props}
      view={view}
      onAnswer={(n) => {
        props.onAnswer(n)
        setView({ dialog: view.dialog, phase: 'failed', line: 'Not sent — herdr-unavailable', retry: true })
      }}
    />
  )
}

// No sure options: the read text, read-only, with "Answer in the terminal".
export const ReadOnly: Story = {
  args: { view: { dialog: rawOnly, phase: 'ready' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Answer in the terminal')).toBeVisible()
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}
export const ReadOnlyLight: Story = { ...ReadOnly, globals: { mode: 'light' } }

/** Sets the text size's class on `<html>` while the story shows (`textSizeClass`, d-122). */
function AtTextSize({ size, children }: { size: TextSize; children: ReactNode }) {
  useLayoutEffect(() => {
    const name = textSizeClass[size]
    if (name === null) return undefined
    document.documentElement.classList.add(name)
    return () => {
      document.documentElement.classList.remove(name)
    }
  }, [size])
  return children
}
const atSize =
  (size: TextSize): Decorator =>
  (Story) => (
    <AtTextSize size={size}>
      <Story />
    </AtTextSize>
  )

// At each text size the card's text wraps and nothing runs past the card.
const fits: Story['play'] = async ({ canvas }) => {
  const box = card(canvas)
  await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
  // Text never runs past its box. Send answer's touch area reaches 12 past its edges, so only its edge is checked.
  for (const el of box.querySelectorAll('p, label')) await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth)
  for (const el of box.querySelectorAll('p, label, button'))
    await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right)
}
const sized = { view: { dialog: withDetail, phase: 'ready' as const } }
export const TextSizesSmall: Story = { args: sized, decorators: [atSize('small')], play: fits }
export const TextSizesDefault: Story = { args: sized, decorators: [atSize('default')], play: fits }
export const TextSizesLarge: Story = { args: sized, decorators: [atSize('large')], play: fits }
export const TextSizesLargeLight: Story = { ...TextSizesLarge, globals: { mode: 'light' } }
