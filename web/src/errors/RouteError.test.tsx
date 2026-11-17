import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { NotFound } from './NotFound.tsx'
import { RouteError } from './RouteError.tsx'
import { resetRetries } from './retryGuard.ts'

afterEach(() => {
  resetRetries()
  vi.restoreAllMocks()
})

// A small router with the app's defaults: one route whose loader fails
// until `control.fail` is false.
function testRouter(path: string, control: { fail: boolean }) {
  const root = createRootRoute()
  const broken = createRoute({
    getParentRoute: () => root,
    path: '/broken',
    loader: () => {
      if (control.fail) throw new Error('loader failed')
      return 'loaded'
    },
    component: () => <p>Route recovered</p>,
  })
  return createRouter({
    routeTree: root.addChildren([broken]),
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  })
}

describe('route fallbacks', () => {
  it('shows RouteError for a failing loader and reloads the route on Retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const control = { fail: true }
    const view = await testRender(<RouterProvider router={testRouter('/broken', control)} />)
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    control.fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByText('Route recovered')).toBeVisible()
    await view.unmount()
  })

  it('shows NotFound for an unknown address', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const view = await testRender(<RouterProvider router={testRouter('/nowhere', { fail: false })} />)
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await view.unmount()
  })
})
