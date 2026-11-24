import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { cdp, page, userEvent } from 'vitest/browser'
// The Playwright provider's types give `cdp()` its `send`.
import type {} from '@vitest/browser-playwright'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Review R59 part 1 (the owner, on his phone: "on mobile this new chat button is kind of huge"): the + menu takes the
// standard rows of the ⋯ chat menus, the library's `Menu` at size md with `touch`, so on a touch screen (a coarse
// pointer) each row is at least 44 high, with the ⋯ menus' 14 px labels. The owner's path: the app with no URL, then
// Workspaces, with the live stub as the server; Chromium's touch emulation gives the coarse pointer.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

/** Turns Chromium's touch emulation on or off: on, `(pointer: coarse)` matches, as on a phone or a tablet. */
const touchScreen = (enabled: boolean) =>
  cdp().send('Emulation.setTouchEmulationEnabled', enabled ? { enabled, maxTouchPoints: 5 } : { enabled })

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await touchScreen(false)
  queryClient.clear()
  resetAllStores()
  await setViewport(1512, 982)
})

/** Opens the app at `width` with no URL and taps Workspaces. */
async function tapWorkspaces(width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  view = await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  await expect.element(page.getByText('plan the slice', { exact: true }).first()).toBeVisible()
}

/** The height and the label's text size of the open menu's New chat row. */
async function newChatRow() {
  const row = page.getByRole('menuitem', { name: 'New chat' })
  await expect.element(row).toBeVisible()
  const element = row.element()
  return { height: element.getBoundingClientRect().height, text: getComputedStyle(element).fontSize }
}

/** The + menu's New chat row; the menu closes after. */
async function plusRow() {
  await userEvent.click(page.getByRole('button', { name: 'New chat or workspace' }))
  const row = await newChatRow()
  await userEvent.keyboard('{Escape}')
  await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
  return row
}

/** A chat's ⋯ menu's New chat row, on the tablet's open chat. */
async function moreRow() {
  await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await userEvent.click(page.getByRole('button', { name: 'plan the slice actions' }).first())
  return newChatRow()
}

describe('the + menu takes the ⋯ menus’ touch rows (R59)', () => {
  it('draws New chat as tall as a ⋯ row, at least 44, with its 14 px label, on a touch tablet (744)', async () => {
    await touchScreen(true)
    await tapWorkspaces(744, 1133)
    const plus = await plusRow()
    const more = await moreRow()
    expect(plus.height).toBeGreaterThanOrEqual(44)
    expect(more.height).toBeGreaterThanOrEqual(44)
    expect(plus.height).toBe(more.height)
    expect(plus.text).toBe(more.text)
  })

  it('draws the phone’s New chat as tall as the tablet’s ⋯ row, at least 44, with its label (390)', async () => {
    await touchScreen(true)
    await tapWorkspaces(390, 844)
    const plus = await plusRow()
    // The phone's ⋯ opens a sheet, not a menu: the ⋯ menu to match is the tablet's, after the window widens.
    await setViewport(744, 1133)
    const more = await moreRow()
    expect(plus.height).toBeGreaterThanOrEqual(44)
    expect(plus.height).toBe(more.height)
    expect(plus.text).toBe(more.text)
  })
})
