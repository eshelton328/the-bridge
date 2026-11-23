import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement } from 'react'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { quiet, shown, withServer } from './inboxLiveHelpers.ts'
import { pendingTiming } from './router.ts'
import { routeTree } from './routeTree.gen.ts'

// The loading standard (2026-11-23) on the owner's path: a cold start with no URL parameters and a slow server.
// The app draws its nav and the Inbox's skeleton list at once, never an empty screen, then the rows; a later read of
// the shown list keeps its rows. Every title is made up (inboxLiveHelpers.ts).
answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const sizes = [
  { name: 'the phone', size: [390, 844], nav: '[data-figma="tab bar"]' },
  { name: 'the tablet', size: [744, 1133], nav: '[data-figma="tab bar"]' },
  { name: 'the desktop', size: [1512, 982], nav: '[data-figma="rail · Inbox"]' },
] as const

/** The fake server, with each list read held until `release` is called. */
function slowServer() {
  const server = withServer()
  const fast = globalThis.fetch
  const held: (() => void)[] = []
  let holding = true
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (holding && new URL(url, window.location.origin).pathname === '/api/inbox') {
        await new Promise<void>((resolve) => held.push(resolve))
      }
      return fast(input, init)
    }),
  )
  return {
    server,
    hold: () => {
      holding = true
    },
    release: () => {
      holding = false
      for (const go of held.splice(0)) go()
    },
  }
}

async function openApp(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
    ...pendingTiming,
  })
  const view = await testRender(createElement(RouterProvider, { router }))
  onTestFinished(view.unmount)
  return router
}

const skeleton = () => page.getByRole('status', { name: 'Loading the Inbox' })

describe('the Inbox while it loads', () => {
  for (const device of sizes) {
    it(`draws the nav and the skeleton list at once on a cold start, then the rows, on ${device.name}`, async () => {
      const slow = slowServer()
      const router = await openApp(device.size)
      await expect.poll(() => router.state.location.pathname).toBe('/inbox')
      await expect.element(skeleton()).toBeInTheDocument()
      expect(document.querySelector(device.nav)).not.toBeNull()
      // The list's own header draws as loaded, with no count, and no row is there yet.
      await expect.element(page.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument()
      // The skeleton rows draw the list row's title slot with no text.
      expect(shown().filter((title) => title.trim())).toEqual([])
      slow.release()
      await expect
        .poll(shown)
        .toEqual(['Sample question from a chat', 'Sample request in the brain', 'Sample chat turn to review'])
      await expect.element(skeleton()).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

    it(`keeps the rows while a later read of the list waits, on ${device.name}`, async () => {
      const slow = slowServer()
      slow.release()
      await openApp(device.size)
      await expect.poll(shown).toHaveLength(3)
      slow.hold()
      slow.server.emit('inbox.changed')
      await quiet(pendingTiming.defaultPendingMs + 200)
      expect(shown()).toHaveLength(3)
      expect(skeleton().query()).toBeNull()
      slow.release()
    })
  }
})
