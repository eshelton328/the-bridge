import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement, type ReactElement } from 'react'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { fakeInboxServer, type FakeInboxServer } from '../lib/fakeInboxServer.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import {
  badge,
  chatItem,
  shown,
  withInboxFeed,
  type Device,
  devices,
  question,
  quiet,
  request,
  review,
} from './inboxLiveHelpers.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The app's live Inbox badge (app/InboxFeedProvider.tsx, lib/inboxFeed.ts) on the owner's path: the app as main.ts
// mounts it, with the feed, opened at `/`; then Workspaces or Artifacts from the rail on the desktop, or from the tab
// bar and the More drawer on the phone. The Inbox routes and the event stream are the contract-checked fake
// (lib/fakeInboxServer.ts); the Workspaces and Artifacts reads are the live stub (app/liveServerStub.ts). Every title is
// made up.
stubLiveServer()

afterEach(async () => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(document, 'hidden')
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

/** The fake Inbox in front of the live stub: the Inbox routes and the event stream go to the fake, the rest to the stub. */
function withInbox(items: readonly unknown[] = [question, review, request]): FakeInboxServer {
  const server = fakeInboxServer({ items })
  const stub = globalThis.fetch
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      location.origin,
    )
    const mine = url.pathname.startsWith('/api/inbox') || url.pathname === '/api/events'
    const answer = mine ? server.handle(url.pathname, init) : undefined
    return answer === undefined ? stub(input, init) : Promise.resolve(answer)
  })
  return server
}

/** Makes the page hidden (`hidden` true) or visible again, with the events Safari sends. */
function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
  document.dispatchEvent(new Event('visibilitychange'))
  if (!hidden) window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
}

/** The app at `path` at the device's size, with the live Inbox feed when `feed` (as mountApp gives it) or without. */
async function openApp(device: Device, path: string, feed = true) {
  await setViewport(device.size[0], device.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
  })
  const routes = createElement(RouterProvider, { router })
  const app: ReactElement = feed ? withInboxFeed(routes) : routes
  const view = await testRender(app)
  onTestFinished(view.unmount)
  return router
}

const navItem = (figma: string) => {
  const el = document.querySelector(`[data-figma="${figma}"]`)
  return el instanceof HTMLElement ? el : null
}

/** Taps the nav to `to`: the rail on the desktop; the tab bar, or More and its drawer, on the phone. */
async function tapTo(device: Device, to: 'workspaces' | 'artifacts') {
  const desktop = device.name === 'the desktop'
  const label = to === 'workspaces' ? 'Workspaces' : 'Artifacts'
  if (desktop || to === 'workspaces') {
    const figma = `${desktop ? 'rail' : 'tab'} · ${label}`
    await expect.poll(() => navItem(figma)).not.toBeNull()
    navItem(figma)?.click()
    return
  }
  await expect.poll(() => navItem('tab · More')).not.toBeNull()
  navItem('tab · More')?.click()
  await userEvent.click(page.getByRole('dialog').getByText('Artifacts', { exact: true }))
}

describe('the live Inbox badge', () => {
  for (const device of devices) {
    for (const to of ['workspaces', 'artifacts'] as const) {
      it(`shows the server's count on ${to} and follows inbox.changed, on ${device.name}`, async () => {
        const server = withInbox()
        const router = await openApp(device, '/')
        await expect.poll(() => router.state.location.pathname).toBe('/inbox')
        await tapTo(device, to)
        // The page shows once the router resolved the move: until then the Inbox page, and its badge, stay.
        await expect
          .poll(() => router.state.status === 'idle' && router.state.resolvedLocation?.pathname)
          .toBe(`/${to}`)
        await expect.poll(() => shown().length).toBe(0)
        // One question and one open request need the owner.
        await expect.poll(() => badge(device)).toBe(2)
        server.put(chatItem(4, 'Another sample question', 'question', 1))
        await expect.poll(() => badge(device)).toBe(3)
      })
    }

    it(`shows no sample number on a live page before the server answers, on ${device.name}`, async () => {
      const server = withInbox()
      server.answerNext('list', () => new Promise<Response>(() => undefined), 10)
      const router = await openApp(device, '/workspaces')
      await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
      await expect.poll(() => navItem(device.nav)).not.toBeNull()
      await quiet()
      expect(badge(device)).toBeNull()
    })

    for (const path of ['/workspaces?source=fixtures', '/artifacts?source=fixtures']) {
      it(`keeps the sample number on ${path}, on ${device.name}`, async () => {
        withInbox()
        const plain = await openApp(device, path, false)
        await expect.poll(() => plain.state.location.href).toBe(path)
        await expect.poll(() => badge(device)).not.toBeNull()
        const sample = badge(device)
        await unmountRendered()
        await openApp(device, path)
        await expect.poll(() => badge(device)).toBe(sample)
        await quiet()
        expect(badge(device)).toBe(sample)
        expect(sample).not.toBe(2)
      })
    }
  }

  it('reports a badge reply the contract refuses by a fixed message, with no part of the reply', async () => {
    const server = withInbox()
    const refused = { items: [{ title: 'Sample title that never goes to a report' }], counts: 'none' }
    server.answerNext('list', () => new Response(JSON.stringify(refused), { status: 200 }), 1)
    const device = devices[0]
    const router = await openApp(device, '/workspaces')
    await expect.poll(() => router.state.resolvedLocation?.pathname).toBe('/workspaces')
    // The Workspaces stub reports its own transcript misses; only the Inbox's reports matter here.
    const inbox = () => getReports().filter((r) => r.error.name.startsWith('Inbox'))
    await expect.poll(() => inbox().length).toBe(1)
    expect(inbox().map((r) => [r.error.name, r.error.message])).toEqual([
      ['InboxRefusedError', 'An inbox request missed: badge refused by the contract'],
    ])
    expect(badge(device)).toBeNull()
  })

  it('closes its stream in the background and keeps one open stream after three trips there', async () => {
    const server = withInbox()
    const device = devices[0]
    await openApp(device, '/')
    await expect.poll(() => badge(device)).toBe(2)
    await expect.poll(() => server.streams()).toBe(1)
    for (let trip = 1; trip <= 3; trip += 1) {
      setHidden(true)
      await expect.poll(() => server.streams()).toBe(0)
      setHidden(false)
      await expect.poll(() => server.streams()).toBe(1)
    }
    await quiet()
    expect(server.streams()).toBe(1)
    // The stream that opened on the last return still carries changes to the badge.
    server.put(chatItem(4, 'Another sample question', 'question', 1))
    await expect.poll(() => badge(device)).toBe(3)
  })

  it('reads the list once for each inbox.changed while the Inbox page shows: the page loads it for the badge', async () => {
    const server = withInbox()
    const device = devices[0]
    await openApp(device, '/')
    await expect.poll(() => badge(device)).toBe(2)
    await expect.poll(() => server.streams()).toBe(1)
    await quiet()
    const before = server.calls('list').length
    server.put(chatItem(4, 'Another sample question', 'question', 1))
    await expect.poll(() => badge(device)).toBe(3)
    await quiet()
    expect(server.calls('list').length - before).toBe(1)
  })
})
