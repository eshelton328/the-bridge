import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Toolkit through the real route and page entry: what the props-only
// stories cannot show, because they do not navigate.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(() => {
  resetAllStores()
})

describe('the Toolkit route', () => {
  it('opens each page that has a route from the rail', async () => {
    await page.viewport(1512, 982)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/toolkit'] }) })
    const view = await testRender(<RouterProvider router={router} />)
    for (const [name, path] of [
      ['Workspaces', '/workspaces'],
      ['Artifacts', '/artifacts'],
      ['Inbox', '/inbox'],
    ] as const) {
      await router.navigate({ to: '/toolkit' })
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('button', { name: new RegExp(`^${name}`) })
        .click()
      await expect.poll(() => router.state.location.pathname).toBe(path)
    }
    await view.unmount()
  })
})
