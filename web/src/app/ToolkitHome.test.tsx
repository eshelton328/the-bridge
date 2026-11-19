import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// /toolkit with no ?state= opens the page's home (pages/toolkit/home.ts): the
// list with nothing open, laid out for the window's width (D1 on a desktop,
// T1 on a tablet, M1 on a phone). A ?state= still opens its state file.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined
let router: ReturnType<typeof createRouter> | undefined

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const layer = (figma: string) => document.querySelector(`[data-figma="${figma}"]`)
/** The desktop rail's Toolkit item; the tablet and phone tab bars have none. */
const rail = () => layer('rail · Toolkit')
const tabBar = () => layer('tab bar')
/** The desktop and tablet header's List, Map and Activity switch; the phone shows icon buttons instead. */
const viewSwitch = () => layer('view · List, Map or Activity')
const phoneMapButton = () => layer('button · map')
/** The desktop card's description, which the tablet's and phone's rows leave out. */
const description = 'Writes and audits the AGENTS.md context file in each folder'
const overlays = () =>
  [...document.querySelectorAll('[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"]')].filter(
    (el) => el.checkVisibility(),
  )

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('the Toolkit home', () => {
  it('draws the desktop list (D1) at 1512 with nothing open', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/toolkit')
    await expect.poll(rail).not.toBeNull()
    expect(tabBar()).toBeNull()
    await expect.element(page.getByText(description)).toBeVisible()
    expect(layer('toolkit card · agents-md')).not.toBeNull()
    expect(overlays()).toHaveLength(0)
  })

  it('draws the tablet list (T1) at 756 with nothing open', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/toolkit')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    expect(viewSwitch()).not.toBeNull()
    expect(layer('toolkit row · agents-md')).not.toBeNull()
    expect(page.getByText(description).query()).toBeNull()
    expect(layer('group · RULES')).not.toBeNull()
    expect(overlays()).toHaveLength(0)
  })

  it('draws the phone list (M1) at 390 with nothing open', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/toolkit')
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    expect(viewSwitch()).toBeNull()
    expect(phoneMapButton()).not.toBeNull()
    expect(layer('toolkit row · agents-md')).not.toBeNull()
    expect(page.getByText(description).query()).toBeNull()
    expect(overlays()).toHaveLength(0)
  })

  it('changes from the desktop to the phone list as the window narrows', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/toolkit')
    await expect.poll(rail).not.toBeNull()
    await page.viewport(390, 844)
    await expect.poll(tabBar).not.toBeNull()
    expect(rail()).toBeNull()
    expect(phoneMapButton()).not.toBeNull()
  })

  it('opens an item tapped on the phone, under Back to Toolkit', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/toolkit')
    await expect.poll(() => layer('toolkit row · agents-md')).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: /^agents-md/ }))
    await expect.element(page.getByRole('button', { name: 'Back to Toolkit' })).toBeVisible()
    expect(layer('toolkit row · ambitious')).toBeNull()
  })

  it('keeps a ?state= on its state file: toolkitList opens D1 without the Rules group', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/toolkit?state=toolkitList')
    await expect.poll(() => layer('toolkit card · agents-md')).not.toBeNull()
    expect(layer('group · RULES')).toBeNull()
  })

  it('goes to the Inbox from the tablet tab bar', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/toolkit')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: /^Inbox/ }))
    await expect.poll(() => router?.state.location.pathname).toBe('/inbox')
  })

  it('stays on the Toolkit list from More in the tablet tab bar, as More is the way to it', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/toolkit')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'More' }))
    expect(router?.state.location.pathname).toBe('/toolkit')
    expect(layer('toolkit row · agents-md')).not.toBeNull()
    expect(overlays()).toHaveLength(0)
  })

  it('opens the More drawer from the phone tab bar and goes to Artifacts from it', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/toolkit')
    await expect.poll(tabBar).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'More' }))
    const drawer = page.getByRole('dialog')
    await expect.element(drawer).toBeVisible()
    await userEvent.click(drawer.getByRole('button', { name: /^Artifacts/ }))
    await expect.poll(() => router?.state.location.pathname).toBe('/artifacts')
  })

  it.each([
    ['phone', 390, 844],
    ['tablet', 756, 1024],
  ] as const)('goes back to the list from an item opened on the %s', async (_, width, height) => {
    await page.viewport(width, height)
    view = await renderAt('/toolkit')
    await expect.poll(() => layer('toolkit row · agents-md')).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: /^agents-md/ }))
    const back = page.getByRole('button', { name: 'Back to Toolkit' })
    await expect.element(back).toBeVisible()
    await userEvent.click(back)
    await expect.poll(() => layer('toolkit row · ambitious')).not.toBeNull()
    expect(page.getByRole('button', { name: 'Back to Toolkit' }).query()).toBeNull()
    expect(tabBar()).not.toBeNull()
  })
})
