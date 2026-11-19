import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// /artifacts with no ?state= opens the page's home (pages/artifacts/home.ts):
// the library with every menu, sheet and dialog closed, laid out for the
// window's width. A ?state= still draws its own frame.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let router: ReturnType<typeof createRouter> | undefined

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const rail = () => document.querySelector('[data-figma="rail · Artifacts"]')
const tabBar = () => document.querySelector('[data-figma="tab bar"]')
/** A desktop or tablet card (D1, T1) and a phone row (M1). */
const cards = () => document.querySelectorAll('[data-figma^="artifact card · "]')
const rows = () => document.querySelectorAll('[data-figma^="artifact row · "]')
/** The overlays a viewer can see, in the page or a portal. */
const visibleOverlays = () =>
  [...document.querySelectorAll('[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"]')].filter(
    (el) => el.checkVisibility(),
  )

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('the Artifacts home', () => {
  it('draws the phone list at 390 with nothing open', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.poll(() => rows().length).toBeGreaterThan(0)
    expect(cards()).toHaveLength(0)
    await expect.element(page.getByPlaceholder('Search artifacts')).toBeVisible()
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('draws the tablet grid at 756 with nothing open', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/artifacts')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.poll(() => cards().length).toBeGreaterThan(0)
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('draws the desktop grid at 1512 with nothing open', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
    await expect.poll(() => cards().length).toBeGreaterThan(0)
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('changes from the desktop to the phone layout and back as the window narrows and widens', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await expect.poll(rail).not.toBeNull()
    await page.viewport(390, 844)
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.poll(() => rows().length).toBeGreaterThan(0)
    await page.viewport(1512, 982)
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
  })

  it('opens the Filter sheet from the phone home', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'Filter' }))
    await expect.element(page.getByRole('dialog', { name: 'Filter' })).toBeVisible()
  })

  it('opens the Sort menu from the desktop home', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await expect.poll(rail).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'Newest' }))
    await expect.element(page.getByRole('menuitemradio', { name: /Newest first/ })).toBeVisible()
  })

  it('goes to the Inbox from the tablet tab bar', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/artifacts')
    await expect.poll(tabBar).not.toBeNull()
    // The tab, not the "Inbox task lifecycle" card, which is a button too now that a card opens its artifact.
    const tab = document.querySelector('[data-figma="tab · Inbox"]')
    if (!(tab instanceof HTMLElement)) throw new Error('no Inbox tab')
    await userEvent.click(tab)
    await expect.poll(() => router?.state.location.pathname).toBe('/inbox')
  })

  it('opens the More drawer from the phone tab bar and goes to Toolkit from it', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: /^More/ }))
    await userEvent.click(page.getByRole('button', { name: /^Toolkit/ }))
    await expect.poll(() => router?.state.location.pathname).toBe('/toolkit')
  })

  it('keeps a ?state= frame: libraryPhone draws M1 at 390', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts?state=libraryPhone')
    await expect.poll(tabBar).not.toBeNull()
    await expect.poll(() => rows().length).toBeGreaterThan(0)
  })
})
