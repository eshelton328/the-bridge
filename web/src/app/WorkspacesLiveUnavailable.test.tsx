import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { clearReports } from '../errors/reporter.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// /workspaces?source=live on the phone (audit W-2, d-117): when the live read
// misses, the page shows no workspaces, with a notice and Retry in the page;
// a reply the contract refuses is a bug, so the route shows RouteError.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

/** Every request the page makes gets this answer, each time a new one. */
function answer(body: string, status: number) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, { status }))),
  )
}

async function openLive() {
  await setViewport(390, 844)
  // The app's error fallback (app/router.ts), so a loader that throws shows RouteError.
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/workspaces?source=live'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />)
}

describe('the live Workspaces page on the phone', () => {
  it('shows the live-unavailable notice on the phone list, with no sample workspace, with the server down', async () => {
    answer('', 502)
    await openLive()
    const notice = () => page.getByRole('alert').filter({ hasText: 'Live data unavailable — no workspaces shown' })
    await expect.element(notice()).toBeVisible()
    await expect
      .element(notice().getByText('The-bridge server did not answer (502). Start it or check the tailnet, then retry.'))
      .toBeVisible()
    await expect.element(notice().getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible()
    await expect.element(page.getByText('release notes')).not.toBeInTheDocument()
    await expect.element(page.getByText('bridge themes')).not.toBeInTheDocument()
  })

  it('shows RouteError, not the sample data, when a 200 reply does not match the contract', async () => {
    // The router logs the loader's throw; RouteError is what the owner sees.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    answer(JSON.stringify({ machine: 'mac-mini', workspaces: 'none' }), 200)
    await openLive()
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    await expect.element(page.getByText('release notes')).not.toBeInTheDocument()
    await expect.element(page.getByText('Live data unavailable — no workspaces shown')).not.toBeInTheDocument()
  })

  it('shows an empty list, with no sample workspace and no notice, when the server has no workspaces (P-3)', async () => {
    answer(JSON.stringify({ machine: 'mac-mini', workspaces: [] }), 200)
    await openLive()
    await expect.element(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible()
    await expect.element(page.getByText('release notes')).not.toBeInTheDocument()
    await expect.element(page.getByText('omni-brain')).not.toBeInTheDocument()
    await expect.element(page.getByText('This page failed to load')).not.toBeInTheDocument()
    await expect.element(page.getByText('Live data unavailable — no workspaces shown')).not.toBeInTheDocument()
  })
})
