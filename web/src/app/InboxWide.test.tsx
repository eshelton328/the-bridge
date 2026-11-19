import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { token } from '../../styled-system/tokens/index.js'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Erik reviewed the Inbox on a 3540 px monitor (screen review R1 to R3): the discussion should be a side pane, not
// most of the screen; its chat and reply box should keep a reading width; the task should show more of its prompt.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await setViewport(1512, 982)
})

const px = (name: Parameters<typeof token>[0]) => Number.parseFloat(token(name))

async function open(state: string, w: number, h: number) {
  await setViewport(w, h)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
  })
  view = await testRender(<RouterProvider router={router} />)
}

/** The prompt's line count (D13's Sent prompt), from the variant class of its `Clamp` (`clamp--lines_5`). */
async function promptLines() {
  await expect.element(page.getByRole('link', { name: 'Read the whole prompt' })).toBeInTheDocument()
  const pane = document.querySelector('[data-figma="task pane"]')
  return [...(pane?.querySelectorAll('[class*="clamp--lines_"]') ?? [])].map(
    (el) => /clamp--lines_(\d+)/.exec(el.className)?.[1],
  )
}

describe('the Inbox on a wide screen', () => {
  it('shows five lines of the prompt in a 1512 px window (D13)', async () => {
    await open('filtered', 1512, 982)
    await expect.poll(promptLines).toEqual(['5'])
  })

  it('shows eight lines of the prompt in a detail at least 1600 px wide (R2)', async () => {
    await open('filtered', 3540, 1300)
    await expect.poll(promptLines).toEqual(['8'])
  })

  it('keeps the discussion a side pane and its reply box at the thread width (R1, R3)', async () => {
    await open('discussOpen', 3540, 1300)
    const field = page.getByRole('textbox', { name: 'Ask about this task' })
    await expect.element(field).toBeInTheDocument()
    const split = document.querySelector('[data-figma="task pane"]')?.firstElementChild
    const [item, side] = [...(split?.children ?? [])].map((el) => el.getBoundingClientRect().width)
    expect(side).toBeLessThanOrEqual(px('sizes.shell.discussionPane'))
    expect(side).toBeLessThan(item ?? 0)
    const composer = field.element().closest('[data-figma="composer · discussion"]')
    expect(composer?.getBoundingClientRect().width).toBeLessThanOrEqual(px('sizes.shell.thread'))
  })
})
