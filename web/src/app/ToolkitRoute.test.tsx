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
import { setViewport } from '../lib/rendering.ts'

// The Toolkit through the real route and page entry: what the props-only
// stories cannot show, because they do not navigate.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'
// The Workspaces home reads the live source (d-117): a stubbed server, never the one on this machine.
stubLiveServer()

afterEach(() => {
  resetAllStores()
})

describe('the Toolkit route', () => {
  // One test for each page: under CPU load one click takes seconds to
  // reach the page, and three clicks in one test passed its 15 s timeout.
  describe('opens each page that has a route from the rail', () => {
    it.each([
      ['Workspaces', '/workspaces'],
      ['Artifacts', '/artifacts'],
      ['Inbox', '/inbox'],
    ] as const)('%s', async (name, path) => {
      await setViewport(1512, 982)
      const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/toolkit'] }) })
      const view = await testRender(<RouterProvider router={router} />)
      await router.navigate({ to: '/toolkit' })
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('button', { name: new RegExp(`^${name}`) })
        .click()
      await expect.poll(() => router.state.location.pathname).toBe(path)
      await view.unmount()
    })
  })
})
