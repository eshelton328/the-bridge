import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The Inbox home reads the live Inbox (d-117): a stubbed server, never the one on this machine.
stubLiveServer()

// "/" redirects to the Inbox (routes/index.tsx), so the app opens on the
// Inbox's home. Each page's own home is checked in its <Page>Home test.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
})

describe('the default route', () => {
  it('opens / on the Inbox home', async () => {
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
    view = await testRender(<RouterProvider router={router} />)
    await expect.poll(() => router.state.location.pathname).toBe('/inbox')
    expect(router.state.location.search).toEqual({})
    await expect.element(page.getByRole('searchbox', { name: 'Search the inbox' })).toBeVisible()
  })
})
