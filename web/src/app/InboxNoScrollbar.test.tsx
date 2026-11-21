import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { resetAllStores } from '../state/resetStores.ts'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { testRender } from '../lib/testRender.ts'
import './inboxRouteHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R14 (no scroll bars anywhere): every box of the Inbox that scrolls hides its scroll bar, at the
// phone, tablet and desktop sizes. Headless Chromium draws no scroll bars at all, so the test reads each scrolling
// box's computed scrollbar-width, which the library's scroll areas set to none.
const sizes = [
  ['phone', 390, 844],
  ['tablet', 756, 1024],
  ['desktop', 1512, 982],
] as const

/** The boxes that scroll vertically: their computed overflow-y is auto or scroll. */
function scrollers(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => {
    const y = getComputedStyle(el).overflowY
    return y === 'auto' || y === 'scroll'
  })
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('the Inbox list draws no scroll bar', () => {
  for (const [name, width, height] of sizes) {
    it(`hides the scroll bar of each scrolling box of the list at the ${name} size`, async () => {
      await page.viewport(width, height)
      // The Inbox as the owner opens it: /inbox with no state, its home.
      const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/inbox'] }) })
      view = await testRender(<RouterProvider router={router} />)
      await expect.element(page.getByText('Pick the header logo', { exact: true })).toBeVisible()
      const boxes = scrollers()
      expect(boxes.length).toBeGreaterThan(0)
      for (const box of boxes) expect.soft(getComputedStyle(box).scrollbarWidth, box.className).toBe('none')
    })
  }
})
