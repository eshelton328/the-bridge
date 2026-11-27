import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Projects home through the real route tree (pages/AGENTS.md, The home state): with no ?state= it shows D10's
// projects (on ?source=fixtures; the live home is ProjectsLive.test.tsx) with every menu and the More drawer closed, laid out for the window, with Projects selected.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the Projects home', () => {
  for (const [name, width, height] of [
    ['the desktop', 1512, 982],
    ['the tablet', 744, 1133],
    ['the phone', 390, 844],
  ] as const) {
    it(`shows the cards with every menu closed on ${name}`, async () => {
      await setViewport(width, height)
      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ['/projects?source=fixtures'] }),
      })
      const view = await testRender(<RouterProvider router={router} />)
      onTestFinished(view.unmount)
      await expect.element(page.getByRole('heading', { name: 'NCC-1701' })).toBeVisible()
      await expect.element(page.getByRole('heading', { name: 'omni' })).toBeVisible()
      expect(document.querySelector('[role="menu"][data-state="open"]')).toBeNull()
      expect(page.getByRole('dialog').elements()).toHaveLength(0)
      expect(document.querySelector('[aria-current="page"]')?.textContent).toContain('Projects')
    })
  }
})
