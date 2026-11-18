import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The How it works tab of an open skill through the real route, with the app's styles and fonts as in main.ts. On
// the desktop (D14) the steps sit four to a row; on a narrow screen (T10 and M12 draw them in a column) four columns
// would leave each card about 50 px wide, so the steps stack in one column, each card as wide as the list.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let unmount: (() => Promise<void>) | undefined
afterEach(async () => {
  await unmount?.()
  resetAllStores()
  await page.viewport(1512, 982)
})

async function renderSteps(width: number, height: number) {
  await page.viewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=skillHowItWorks'] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
  await expect.poll(() => document.querySelectorAll('[data-figma^="step "]').length).toBeGreaterThan(4)
  const list = document.querySelector('[data-figma="steps"]')?.getBoundingClientRect()
  const cards = [...document.querySelectorAll('[data-figma^="step "]')].map((c) => c.getBoundingClientRect())
  return { list, cards }
}

describe('the How it works steps', () => {
  it('stack in one column on the phone, each card as wide as the list', async () => {
    const { list, cards } = await renderSteps(390, 844)
    expect(list).toBeDefined()
    for (const c of cards) expect(Math.round(c.width)).toBe(Math.round(list?.width ?? 0))
    for (let i = 1; i < cards.length; i++) expect(cards[i]?.top ?? 0).toBeGreaterThanOrEqual(cards[i - 1]?.bottom ?? 0)
  })

  it('stay four to a row on the desktop (D14)', async () => {
    const { cards } = await renderSteps(1512, 982)
    const top = Math.round(cards[0]?.top ?? -1)
    expect(cards.filter((c) => Math.round(c.top) === top)).toHaveLength(4)
  })
})
