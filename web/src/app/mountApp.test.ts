import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { mountApp } from './mountApp.ts'

// Audit W-9: the app's boot wiring, mounted as main.ts mounts it. A route that throws while it renders, a window
// error and an unhandled rejection each reach the reporter, and the dev ErrorTray counts them.
const crash = new Error('the route crashed on purpose')

/** A router whose route throws; with `aboveRoutes`, its Wrap throws, so AppBoundary catches the crash. */
function crashingRouter(aboveRoutes = false) {
  const root = createRootRoute()
  const home = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => {
      throw crash
    },
  })
  return createRouter({
    routeTree: root.addChildren([home]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
    // The router's Wrap renders outside its own error boundaries, so a throw there reaches AppBoundary.
    ...(aboveRoutes
      ? {
          Wrap: () => {
            throw crash
          },
        }
      : {}),
    defaultNotFoundComponent: NotFound,
  })
}

// A stand-in for the window, so the test's events never reach Vitest's own window error listener.
const events = new EventTarget()
let unmount: (() => void) | undefined
let container: HTMLElement | undefined

function mount(aboveRoutes = false, push?: boolean) {
  container = document.createElement('div')
  document.body.append(container)
  unmount = mountApp(container, {
    router: crashingRouter(aboveRoutes),
    events,
    ...(push === undefined ? {} : { push }),
  })
}

afterEach(() => {
  unmount?.()
  unmount = undefined
  container?.remove()
  container = undefined
  clearReports()
  resetRetries()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('mountApp', () => {
  it('reports a route that throws while it renders once, shows RouteError and counts it in the ErrorTray', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mount()
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: '1 error' })).toBeVisible()
    expect(getReports().map((r) => [r.source, r.error])).toEqual([['root-caught', crash]])
  })

  it('reports a window error and an unhandled rejection, and stops when unmounted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mount()
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    clearReports()
    const fromTimer = new Error('from a timer')
    events.dispatchEvent(new ErrorEvent('error', { error: fromTimer, message: fromTimer.message }))
    const reason = new Error('from a promise')
    events.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason }))
    unmount?.()
    unmount = undefined
    events.dispatchEvent(new ErrorEvent('error', { error: new Error('after unmount') }))
    expect(getReports().map((r) => [r.source, r.error])).toEqual([
      ['window', fromTimer],
      ['rejection', reason],
    ])
    expect(container?.childElementCount).toBe(0)
  })

  it('still shows the ErrorTray when AppBoundary catches a crash and replaces the app (audit W-11)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mount(true)
    await expect.element(page.getByRole('heading', { name: 'The Bridge hit an error' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: '1 error' })).toBeVisible()
    expect(getReports().map((r) => r.error)).toEqual([crash])
  })

  it('registers no service worker and sends no "seen" in a test (d-118)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const register = vi.spyOn(navigator.serviceWorker, 'register')
    const fetches = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetches)
    mount()
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    expect(register).not.toHaveBeenCalled()
    expect(fetches).not.toHaveBeenCalled()
  })

  it('with push on, registers /sw.js for the whole app once, sends "seen" and stops on unmount (d-118)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const register = vi
      .spyOn(navigator.serviceWorker, 'register')
      .mockImplementation(() => Promise.reject(new TypeError('no worker in tests')))
    const seen: string[] = []
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      seen.push(`${init?.method ?? 'GET'} ${new URL(url, location.origin).pathname}`)
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    mount(false, true)
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    expect(register.mock.calls).toEqual([['/sw.js', { scope: '/' }]])
    expect(seen).toEqual(['POST /api/push/seen'])
    // A failed registration is reported with its kind only.
    await expect
      .poll(() => getReports().map((r) => [r.source, r.error.name, r.error.message]))
      .toContainEqual(['handler', 'ServiceWorkerMissError', 'The service worker did not register: TypeError'])
    unmount?.()
    unmount = undefined
  })
})
