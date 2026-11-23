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

// /workspaces with no ?state= opens the page's home (pages/workspaces/home.ts):
// every overlay closed, laid out for the window's width. A ?state= still
// draws its own frame's layout. In development the home reads the live
// source (d-117, WorkspacesLiveDefault.test.tsx); these tests draw its
// sample data with ?source=fixtures.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let router: ReturnType<typeof createRouter> | undefined

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const rail = () => document.querySelector('[data-figma="nav rail"]')
const tabBar = () => document.querySelector('[data-figma="tab bar"]')
/** Every menu, list, popover and dialog that the page can open, in the page or a portal. */
const overlays = () =>
  document.querySelectorAll(
    '[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"], [role="radiogroup"]',
  )

/** The overlays a viewer can see. */
const visibleOverlays = () => [...overlays()].filter((el) => el.checkVisibility())

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the Workspaces home', () => {
  it('draws the phone layout at 390 with nothing open', async () => {
    await setViewport(390, 844)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await expect.element(page.getByText('release notes')).toBeVisible()
    // The phone mounts none of them; the desktop keeps its closed menus mounted and hidden, as the library's Ark
    // menus do, so that test counts the visible ones.
    expect(overlays()).toHaveLength(0)
  })

  it('draws the desktop layout at 1512 with nothing open', async () => {
    await setViewport(1512, 982)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('draws the tablet list at 756 with nothing open', async () => {
    await setViewport(756, 1024)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    expect(visibleOverlays()).toHaveLength(0)
  })

  it('goes to Toolkit from the More drawer of the tablet tab bar, as the tablet has no rail (d-119)', async () => {
    await setViewport(756, 1024)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'More' }))
    const drawer = page.getByRole('dialog', { name: 'More' })
    await expect.element(drawer).toBeVisible()
    await userEvent.click(drawer.getByRole('button', { name: /^Toolkit/ }))
    await expect.poll(() => router?.state.location.pathname).toBe('/toolkit')
  })

  it('changes from the desktop to the phone layout and back as the window narrows and widens', async () => {
    await setViewport(1512, 982)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.poll(rail).not.toBeNull()
    await setViewport(390, 844)
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    await setViewport(1512, 982)
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
  })

  it('keeps a ?state= on its frame layout: chatActions draws the desktop at 390', async () => {
    await setViewport(390, 844)
    view = await renderAt('/workspaces?state=chatActions')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
  })

  it('keeps a ?state= on its frame at 1512: chatActions opens its chat menu', async () => {
    await setViewport(1512, 982)
    view = await renderAt('/workspaces?state=chatActions')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
    await expect.element(page.getByRole('menuitem', { name: 'Move to workspace' })).toBeVisible()
  })
})
