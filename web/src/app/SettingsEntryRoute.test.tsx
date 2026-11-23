import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// d-119: every page entry passes `settingsEntry` to its screen, so the app always shows the rail's Settings gear and
// the More drawer's Settings row. A Figma state's story passes none, as Figma draws neither, so this test is what
// fails when an entry stops passing it (bridge-coord's condition for the d-118 method, 2026-11-23).
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const entries = [
  '/inbox?source=fixtures',
  '/workspaces?source=fixtures',
  '/artifacts?source=fixtures',
  '/toolkit?source=fixtures',
]

describe.each(entries)('the Settings entry on %s', (path) => {
  it('shows the rail gear before More at 1512 px', async () => {
    await page.viewport(1512, 982)
    const view = await renderAt(path)
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('[data-figma="rail · More"]')).not.toBeNull()
    const rail = [...document.querySelectorAll('[data-figma^="rail · "]')].map((el) => el.getAttribute('data-figma'))
    expect(rail.slice(-2)).toEqual(['rail · Settings', 'rail · More'])
  })

  for (const [width, height] of [
    [390, 844],
    [744, 1133],
  ] as const) {
    it(`shows the Settings row in the More drawer at ${String(width)} px`, async () => {
      await page.viewport(width, height)
      const view = await renderAt(path)
      onTestFinished(view.unmount)
      await userEvent.click(page.getByRole('button', { name: 'More' }))
      const drawer = page.getByRole('dialog', { name: 'More' })
      await expect.element(drawer.getByRole('button', { name: /Settings/ })).toBeVisible()
      await expect.element(drawer.getByText('Appearance, navigation and chat defaults')).toBeVisible()
    })
  }
})
