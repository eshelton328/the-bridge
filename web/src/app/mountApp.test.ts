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

function crashingRouter() {
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
    defaultNotFoundComponent: NotFound,
  })
}

// A stand-in for the window, so the test's events never reach Vitest's own window error listener.
const events = new EventTarget()
let unmount: (() => void) | undefined
let container: HTMLElement | undefined

function mount() {
  container = document.createElement('div')
  document.body.append(container)
  unmount = mountApp(container, { router: crashingRouter(), events })
}

afterEach(() => {
  unmount?.()
  unmount = undefined
  container?.remove()
  container = undefined
  clearReports()
  resetRetries()
  vi.restoreAllMocks()
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
})
