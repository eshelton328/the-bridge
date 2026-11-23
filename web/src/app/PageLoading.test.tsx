import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement } from 'react'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { pendingTiming } from './router.ts'
import { routeTree } from './routeTree.gen.ts'

// The loading standard (2026-11-23) for a page with no skeleton of its own: while its route loads, the app's shell
// draws the nav with the page selected and a skeleton in its place (blocks/LoadingShell.tsx), never an empty screen.
// The server never answers here, so the page stays in its loading state.

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  resetAllStores()
  await setViewport(1512, 982)
})

const sizes = [
  { name: 'the phone', size: [390, 844], nav: '[data-figma="tab bar"]' },
  { name: 'the tablet', size: [744, 1133], nav: '[data-figma="tab bar"]' },
  { name: 'the desktop', size: [1512, 982], nav: '[data-figma="rail · Workspaces"]' },
] as const

describe('a page while it loads', () => {
  for (const device of sizes) {
    it(`draws the nav and a skeleton for Workspaces on ${device.name}`, async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<Response>(() => undefined)),
      )
      await setViewport(device.size[0], device.size[1])
      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ['/workspaces'] }),
        defaultErrorComponent: RouteError,
        ...pendingTiming,
      })
      const view = await testRender(createElement(RouterProvider, { router }))
      onTestFinished(view.unmount)
      await expect.element(page.getByRole('status', { name: 'Loading Workspaces' })).toBeInTheDocument()
      expect(document.querySelector(device.nav)).not.toBeNull()
    })
  }
})
