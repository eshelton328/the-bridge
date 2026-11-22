import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// R38: on the phone and the tablet a chat row keeps no selected state after a return from the chat to the list, as
// the list shows no chat beside it (the owner: "On tablet and mobile this shouldn't stay highlighted"). The desktop
// sidebar keeps the shown chat selected. Each test takes the owner's path: the app with no URL, then Workspaces, then
// a tap on a chat row, with the stubbed live server.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const chats = ['plan the slice', 'tail logs']

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

async function openWorkspaces(width: number, height: number) {
  await page.viewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.element(page.getByRole('button', { name: 'plan the slice', exact: true })).toBeVisible()
}

/** The chat rows drawn selected: the library's ListRow marks one with `data-selected` and its title `aria-current`. */
const selectedRows = () =>
  [...document.querySelectorAll('[data-selected], [aria-current="true"]')].filter((el) =>
    chats.some((title) => el.textContent.includes(title)),
  )

describe.each([
  ['phone', 390, 844],
  ['iPad mini', 744, 1133],
])('a return from a chat to the list on the %s', (_, width, height) => {
  it('leaves no row selected', async () => {
    await openWorkspaces(width, height)
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
    // The chat's view has no tab bar; its back button is "Back to Workspaces", as in M3.
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces', exact: true }))
    await expect.element(page.getByRole('button', { name: 'plan the slice', exact: true })).toBeVisible()
    expect(selectedRows()).toEqual([])
  })
})

describe('a chat tapped in the desktop sidebar', () => {
  it('stays selected while it shows', async () => {
    await openWorkspaces(1512, 982)
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
    await expect
      .element(page.getByRole('button', { name: 'plan the slice', exact: true }))
      .toHaveAttribute('aria-current', 'true')
    expect(selectedRows().length).toBeGreaterThan(0)
  })
})
