// The fakes and the route render that the Architecture tab's route tests share (ProjectArchitectureRead,
// ProjectArchitectureLive): one project, alpha, whose scopes are System and example-app.
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement } from 'react'
import { onTestFinished, vi } from 'vitest'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { withInboxFeed } from './inboxLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

const commit = 'a'.repeat(40)
/** System with no diagram yet, then a repository with one. */
const scopes = [
  { scope: '@system', title: 'How the system works', commit: null, generatedAt: null, stale: false, running: false },
  {
    scope: 'example-app',
    title: 'How example-app works',
    commit,
    generatedAt: '2026-11-28T10:00:00.000Z',
    stale: false,
    running: false,
  },
]
/** example-app's diagram: two parts, one arrow and two Stack groups. */
const appModel = {
  view: 'component',
  parts: [
    { id: 'p0', name: 'example-app', shape: 'package', ours: true, typeLine: '.' },
    { id: 'p1', name: '@example/web', shape: 'package', ours: true, typeLine: 'web' },
  ],
  boundaries: [],
  arrows: [{ from: 'p1', to: 'p0', label: 'depends on' }],
  stack: [
    { name: 'Runtime', badges: ['react', 'zod'] },
    { name: 'Build', badges: ['vite'] },
  ],
}

/** The fake Projects server with the project alpha and its scopes, and an empty Inbox, as `fetch`. */
export function withServer() {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    { architecture: { alpha: { scopes, models: { 'example-app': appModel } } } },
  )
  const inbox = fakeInboxServer({ items: [] })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
  return projects
}

/** Renders the route tree on `path` at the given size. */
export async function open(path: string, width = 1440, height = 900) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })
  onTestFinished((await testRender(withInboxFeed(createElement(RouterProvider, { router })))).unmount)
  return router
}
