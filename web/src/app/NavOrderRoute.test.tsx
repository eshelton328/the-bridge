import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore } from '../state/settingsStore.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'

// The nav order and visibility of the device settings (d-038, d-119) reach the rail, the tab bar and the More drawer
// through the page entry's props, through the real route: Toolkit moved first and Projects hidden. The blocks read no
// store (blocks/AGENTS.md); the page entry reads it and passes the pages down.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let router = createRouter({ routeTree, history: createMemoryHistory() })

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

/** Toolkit first, Projects hidden. */
function customOrder() {
  const { actions } = settingsStore.getState()
  for (let i = 0; i < 5; i++) actions.moveNavPage('toolkit', -1)
  expect(actions.setNavPageVisible('projects', false, 'inbox')).toBeUndefined()
}

/** The Figma layer names of the items under `selector`, in order. */
const layers = (selector: string) =>
  [...document.querySelectorAll(`${selector} [data-figma]`)].map((el) => el.getAttribute('data-figma'))

describe('the nav order of the device settings', () => {
  it('orders the desktop rail and leaves the hidden page out', async () => {
    customOrder()
    await page.viewport(1512, 982)
    const view = await renderAt('/inbox?source=fixtures')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('[data-figma="rail · Inbox"]')).not.toBeNull()
    const rail = [...document.querySelectorAll('[data-figma^="rail · "]')].map((el) => el.getAttribute('data-figma'))
    expect(rail).toEqual([
      'rail · Toolkit',
      'rail · Inbox',
      'rail · Workspaces',
      'rail · Artifacts',
      // The Settings gear is never hidden and sits before More (d-119).
      'rail · Settings',
      'rail · More',
    ])
    await view.unmount()
  })

  it('shows the first four shown pages in the phone tab bar and the rest in the More drawer', async () => {
    customOrder()
    await page.viewport(390, 844)
    const view = await renderAt('/inbox?source=fixtures')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    expect(layers('[data-figma="tab bar"]').filter((l) => l?.startsWith('tab · '))).toEqual([
      'tab · Toolkit',
      'tab · Home',
      'tab · Inbox',
      'tab · Workspaces',
      'tab · More',
    ])
    await page.getByRole('button', { name: 'More' }).click()
    const drawer = page.getByRole('dialog', { name: 'More' })
    await expect.element(drawer).toBeVisible()
    await expect.element(drawer.getByText('Artifacts')).toBeVisible()
    expect(drawer.getByText('Toolkit').elements()).toHaveLength(0)
    expect(drawer.getByText('Projects').elements()).toHaveLength(0)
    await view.unmount()
  })

  it('keeps the default order with no change, as the Figma frames draw it', async () => {
    await page.viewport(390, 844)
    const view = await renderAt('/inbox?source=fixtures')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    expect(layers('[data-figma="tab bar"]').filter((l) => l?.startsWith('tab · '))).toEqual([
      'tab · Home',
      'tab · Inbox',
      'tab · Workspaces',
      'tab · Projects',
      'tab · More',
    ])
    await view.unmount()
  })

  // The tablet's More opens the More drawer on every page (d-119), with the shown pages past its five tabs (Artifacts once
  // Toolkit moves before it) and Settings; a tap on one opens it.
  for (const path of [
    '/inbox?source=fixtures',
    '/workspaces?source=fixtures',
    '/toolkit?source=fixtures',
    '/settings',
  ]) {
    it(`opens the page past the tablet tabs from the More drawer on ${path}`, async () => {
      settingsStore.getState().actions.moveNavPage('toolkit', -1)
      await page.viewport(820, 1180)
      const view = await renderAt(path)
      onTestFinished(view.unmount)
      await expect.poll(() => document.querySelector('[data-figma="tab bar"]')).not.toBeNull()
      expect(layers('[data-figma="tab bar"]').filter((l) => l?.startsWith('tab · '))).toEqual([
        'tab · Home',
        'tab · Inbox',
        'tab · Workspaces',
        'tab · Projects',
        'tab · Toolkit',
        'tab · More',
      ])
      await page
        .getByRole('tab', { name: 'More' })
        .or(page.getByRole('button', { name: 'More' }))
        .first()
        .click()
      const drawer = page.getByRole('dialog', { name: 'More' })
      await expect.element(drawer).toBeVisible()
      await expect.element(drawer.getByRole('button', { name: /Settings/ })).toBeVisible()
      await drawer.getByRole('button', { name: /Artifacts/ }).click()
      await expect.poll(() => router.state.location.pathname).toBe('/artifacts')
      await view.unmount()
    })
  }
})
