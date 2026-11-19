import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// /inbox with no ?state= opens the page's home (pages/inbox/home.ts): nothing
// selected and every overlay closed, laid out for the window's width. A
// ?state= still draws its own frame.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let router: ReturnType<typeof createRouter> | undefined

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

/** The shell's rail slot, which only the desktop draws. */
const rail = () => document.querySelector('.app-shell__root [data-slot="rail"]')
const tabBar = () => document.querySelector('[data-figma="tab bar"]')
const searchbox = () => page.getByRole('searchbox', { name: 'Search the inbox' })
const task = () => page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })
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
  await setViewport(1512, 982)
})

describe('the Inbox home', () => {
  it('draws the phone list at 390 with nothing open', async () => {
    await setViewport(390, 844)
    view = await renderAt('/inbox')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(task()).not.toBeInTheDocument()
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('draws the desktop list and task at 1512 with nothing open', async () => {
    await setViewport(1512, 982)
    view = await renderAt('/inbox')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(task()).toBeVisible()
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('changes from the desktop to the phone list and back as the window narrows and widens', async () => {
    await setViewport(1512, 982)
    view = await renderAt('/inbox')
    await expect.element(task()).toBeVisible()
    await setViewport(390, 844)
    await expect.poll(tabBar).not.toBeNull()
    await expect.element(task()).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
    await setViewport(1512, 982)
    await expect.poll(rail).not.toBeNull()
    await expect.element(task()).toBeVisible()
  })

  it('draws the tablet list at 756 with nothing open', async () => {
    await setViewport(756, 1158)
    view = await renderAt('/inbox')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(task()).not.toBeInTheDocument()
    expect(visibleOverlays()).toHaveLength(0)
  })

  // The home puts a phone and a tablet on the list, so opening a task and coming back is the usual path.
  for (const [w, h] of [
    [390, 844],
    [756, 1158],
  ] as const)
    it(`opens the task from the list, keeps a typed note after Back, at ${String(w)}`, async () => {
      await setViewport(w, h)
      view = await renderAt('/inbox')
      await page.getByText('Write the tickets for increment one').click()
      await expect.element(task()).toBeVisible()
      await userEvent.type(page.getByRole('textbox', { name: 'Add a note' }), 'Check the ticket size')
      await page.getByRole('button', { name: 'Back to Inbox' }).click()
      await expect.element(task()).not.toBeInTheDocument()
      await expect.element(searchbox()).toBeVisible()
      await page.getByText('Write the tickets for increment one').click()
      await expect.element(page.getByRole('textbox', { name: 'Add a note' })).toHaveValue('Check the ticket size')
    })

  it('goes to Workspaces from the tablet tab bar', async () => {
    await setViewport(756, 1158)
    view = await renderAt('/inbox')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }))
    await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  })

  it('reaches Toolkit from More in the tablet tab bar, as the tablet has no rail', async () => {
    await setViewport(756, 1158)
    view = await renderAt('/inbox')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'More' }))
    const toolkit = page.getByRole('button', { name: 'Toolkit' })
    if (router?.state.location.pathname !== '/toolkit') await userEvent.click(toolkit)
    await expect.poll(() => router?.state.location.pathname).toBe('/toolkit')
  })

  it('keeps a ?state= on its frame: taskPage opens the task at 390', async () => {
    await setViewport(390, 844)
    view = await renderAt('/inbox?state=taskPage')
    await expect.element(task()).toBeVisible()
  })
})
