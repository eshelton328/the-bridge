import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The data source layer through the real routes: `?source=` picks where a
// loader reads its state (lib/dataSource.ts). Fixtures is the default and
// the only source built; mock-api and live show the not-built screen.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultNotFoundComponent: NotFound,
  })
  return { router, rendered: testRender(<RouterProvider router={router} />) }
}

const taskTitle = () => page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })

afterEach(() => {
  resetAllStores()
  vi.restoreAllMocks()
})

describe('the data source', () => {
  it('shows the fixtures state on /inbox with no source and with ?source=fixtures', async () => {
    for (const path of ['/inbox?state=nextStep', '/inbox?state=nextStep&source=fixtures']) {
      const { rendered } = renderAt(path)
      const view = await rendered
      await expect.element(taskTitle()).toBeVisible()
      await view.unmount()
    }
  })

  it('shows "not built yet" for ?source=mock-api and ?source=live, and Use fixtures goes back', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    for (const source of ['mock-api', 'live']) {
      const { router, rendered } = renderAt(`/inbox?state=nextStep&source=${source}`)
      const view = await rendered
      await expect.element(page.getByRole('heading', { name: 'Data source not built yet' })).toBeVisible()
      await expect.element(page.getByText(`The ${source} source is not built yet.`, { exact: false })).toBeVisible()
      await page.getByRole('button', { name: 'Use fixtures' }).click()
      await expect.element(taskTitle()).toBeVisible()
      expect(router.state.location.searchStr).toBe('?state=nextStep')
      await view.unmount()
    }
  })

  it('shows Page not found for an unknown source, as for an unknown state', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { rendered } = renderAt('/workspaces?source=nowhere')
    const view = await rendered
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await view.unmount()
  })
})
