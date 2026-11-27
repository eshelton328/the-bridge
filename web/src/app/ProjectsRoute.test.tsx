import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore } from '../state/settingsStore.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The Projects page through the real route tree (f-008 R1): the Projects item of the rail, the tab bar and the More
// drawer opens /projects from the other pages, whose entries go through navRoute. The stub answers the other pages'
// live reads, never the server on this machine.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'
stubLiveServer()

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await setViewport(1512, 982)
})

async function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  return router
}

describe('the Projects route (R1)', () => {
  it('opens /projects from the desktop rail', async () => {
    await setViewport(1512, 982)
    const router = await renderAt('/artifacts?source=fixtures')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('button', { name: /^Projects/ })
      .click()
    await expect.poll(() => router.state.location.pathname).toBe('/projects')
    await expect.element(page.getByRole('heading', { name: /^Projects/ })).toBeVisible()
  })

  it('opens /projects from the tablet tab bar', async () => {
    await setViewport(744, 1133)
    const router = await renderAt('/toolkit')
    await expect.poll(() => document.querySelector('[data-figma="tab · Projects"]')).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: /^Projects/ }))
    await expect.poll(() => router.state.location.pathname).toBe('/projects')
  })

  it('opens /projects from the More drawer when the owner moved Projects past the phone tab bar', async () => {
    const { actions } = settingsStore.getState()
    // Projects after Artifacts and Toolkit: the phone's tab bar shows Home to Artifacts, and More holds Projects.
    actions.moveNavPage('projects', 1)
    actions.moveNavPage('projects', 1)
    await setViewport(390, 844)
    const router = await renderAt('/inbox?source=fixtures')
    await userEvent.click(page.getByRole('button', { name: /^More/ }))
    const drawer = page.getByRole('dialog', { name: 'More' })
    await expect.element(drawer).toBeVisible()
    await userEvent.click(drawer.getByRole('button', { name: /^Projects/ }))
    await expect.poll(() => router.state.location.pathname).toBe('/projects')
  })
})
