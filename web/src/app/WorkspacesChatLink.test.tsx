import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// d-118: a tap on a push notification opens `/workspaces?chat=<chat ID>` (public/sw.js), or the app's open page
// navigates there (openChatMessages.ts). The live chat opens as a tap on its row would, full screen on the phone,
// and the param leaves the URL. A chat the server does not list, or a value that is not a chat ID, opens nothing.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

async function open(path: string) {
  await page.viewport(390, 844)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  await testRender(<RouterProvider router={router} />)
  return router
}

describe('a link to one chat', () => {
  it('opens the live chat full screen on the phone and drops the param', async () => {
    const router = await open(`/workspaces?chat=${encodeURIComponent('mac-mini/p1')}`)
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    // Full screen: the chat's own view has no tab bar.
    await expect.element(page.getByRole('button', { name: 'Inbox', exact: true })).not.toBeInTheDocument()
    await expect.poll(() => router.state.location.search).toEqual({})
  })

  it.each([
    ['a chat the server does not list', 'mac-mini/gone'],
    ['a value that is not a chat ID', 'https://evil.example/'],
  ])('shows the list for %s', async (_, chat) => {
    const router = await open(`/workspaces?chat=${encodeURIComponent(chat)}`)
    await expect.element(page.getByRole('button', { name: 'plan the slice', exact: true })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).not.toBeInTheDocument()
    await expect.poll(() => router.state.location.search).toEqual({})
  })
})
