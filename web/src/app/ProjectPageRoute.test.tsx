import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { type FakeProjectsServer, fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// A project's page through the real route tree (f-008 R4), with the contract-checked fake of the server's routes
// (lib/fakeProjectsServer.ts): a card of the live home opens /projects/<slug>, which shows Back to Projects, the name,
// Quick chat and only the tabs Overview and Ideas at each width; Back opens the home, and an unknown slug is not
// found. Every name and purpose is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const alpha = { slug: 'alpha', name: 'Alpha', purpose: 'A made-up project.', icon: null, pinned: false }
const beta = { slug: 'beta', name: 'Beta', purpose: 'Another made-up project.', icon: null, pinned: false }
const fetched: string[] = [] // Each URL the page fetched.

/** The fake with two projects, as the page's fetch. */
function withServer(): FakeProjectsServer {
  const server = fakeProjectsServer([alpha, beta])
  fetched.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      fetched.push(url)
      const answer = server.handle(new URL(url, window.location.origin).pathname, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

async function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  return router
}

describe('a project page (R4)', () => {
  for (const [name, width, height] of [
    ['the desktop', 1440, 900],
    ['the tablet', 1024, 1366],
    ['the phone', 390, 844],
  ] as const) {
    it(`opens from its card with the header and the two tabs on ${name}, and Back opens the home`, async () => {
      await setViewport(width, height)
      const server = withServer()
      const router = await renderAt('/projects')
      await userEvent.click(page.getByRole('button', { name: 'Alpha', exact: true }))
      await expect.poll(() => router.state.location.pathname).toBe('/projects/alpha')
      await expect.element(page.getByRole('heading', { level: 1, name: 'Alpha' })).toBeVisible()
      await expect.element(page.getByText('A made-up project.')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Quick chat' })).toBeVisible()
      expect(
        page
          .getByRole('tab')
          .elements()
          .map((t) => t.textContent),
      ).toEqual(['Overview', 'Ideas'])
      expect(server.calls('detail').map((c) => c.path)).toEqual(['/api/projects/alpha'])
      await userEvent.click(page.getByRole('button', { name: 'Back to Projects' }))
      await expect.poll(() => router.state.location.pathname).toBe('/projects')
      expect(getReports()).toEqual([])
    })
  }

  it('says a project the server does not know is not found', async () => {
    withServer()
    await renderAt('/projects/no-such-project')
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  it('says a slug the contract refuses is not found, with no request sent', async () => {
    withServer()
    await renderAt('/projects/alpha%2Fideas')
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    expect(fetched.filter((url) => url.includes('/api/projects/'))).toEqual([])
  })

  it('keeps ?source=fixtures when a card opens the page and when Back opens the home', async () => {
    withServer()
    const router = await renderAt('/projects?source=fixtures')
    await userEvent.click(page.getByRole('button', { name: 'Pinpoint', exact: true }))
    await expect.poll(() => router.state.location.href).toBe('/projects/pinpoint?source=fixtures')
    await expect.element(page.getByRole('heading', { level: 1, name: 'Pinpoint' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Back to Projects' }))
    await expect.poll(() => router.state.location.href).toBe('/projects?source=fixtures')
    expect(fetched.filter((url) => url.includes('/api/projects'))).toEqual([])
  })

  it('says in one line that the read missed, and reports its kind and status', async () => {
    const server = withServer()
    server.answerNext(
      'detail',
      () =>
        new Response(JSON.stringify({ error: { kind: 'internal', message: 'Failed', requestId: 'r-500' } }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
    )
    await renderAt('/projects/alpha')
    await expect
      .element(page.getByRole('status').filter({ hasText: 'Project not read — the server answered 500' }))
      .toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual(['A projects request missed: detail internal 500'])
  })
})
