import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// d-121 (option E), on the owner's path: open /workspaces (its sample home, ?source=fixtures) and, on the phone and the
// tablet, tap a chat's row. The chat header keeps its two rows, and the second row (the model chip, the context meter
// and its label) starts at the left edge of the kind mark. On the phone and the tablet the back button comes before
// the kind mark and the second row does not start under it.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

const chat = 'bridge themes'
const devices = [
  { name: 'the phone', size: [390, 844], tap: true },
  { name: 'the tablet', size: [744, 1133], tap: true },
  { name: 'the desktop', size: [1512, 982], tap: false },
] as const

/** The chat header that shows `chat`'s title. */
function header(): HTMLElement {
  const title = [...document.querySelectorAll('header h2')].find((h) => h.textContent === chat)
  const el = title?.closest('header')
  if (!(el instanceof HTMLElement)) throw new Error('no chat header')
  return el
}

const left = (el: Element | null) => {
  if (el === null) throw new Error('no element')
  return Math.round(el.getBoundingClientRect().left)
}

describe('the chat header rows (d-121, option E)', () => {
  for (const d of devices)
    it(`starts the second row at the kind mark's left edge: ${d.name}`, async () => {
      await page.viewport(d.size[0], d.size[1])
      view = await renderAt('/workspaces?source=fixtures')
      if (d.tap) {
        await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
        await page.getByText(chat, { exact: true }).first().click()
      }
      await expect
        .poll(() => [...document.querySelectorAll('header h2')].some((h) => h.textContent === chat))
        .toBe(true)
      const head = header()
      const mark = head.querySelector('.kind-mark')
      const chip = head.querySelector('button[aria-label^="Model"], [aria-label^="Model"]')
      const back = head.querySelector('button[aria-label="Back to Workspaces"]')
      expect(left(chip)).toBe(left(mark))
      if (d.tap) {
        expect(back).not.toBeNull()
        expect(left(back)).toBeLessThan(left(mark))
        // The rows stay 4 apart, as before: the second row starts 4 under the first.
        const row1 = mark?.parentElement?.getBoundingClientRect()
        const row2 = chip?.getBoundingClientRect()
        if (row1 === undefined || row2 === undefined) throw new Error('no rows')
        expect(row2.top).toBeGreaterThanOrEqual(row1.bottom)
      } else expect(back).toBeNull()
    })
})
