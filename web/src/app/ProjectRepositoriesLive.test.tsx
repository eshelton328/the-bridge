import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { withInboxFeed } from './inboxLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// A live project's Ideas tab (f-008 R10; NCC-132's live slice) with the contract-checked fakes only: the tab
// (`?tab=ideas`) lists the project's idea records, and the Overview reads none.
// A live project's Repositories tab (f-008 increment two, R2, R8; the live slice) with the contract-checked fakes
// only: the tab (`?tab=repositories`) lists each repository with its facts and counts, says which parts were not
// read, and the Overview reads none. Each GitHub repository's row has its kept CI numbers (R4), with "as of" when
// the read is older than 10 minutes, and the tab reads them again on each `projects.changed`.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(document, 'hidden')
  await unmountRendered()
  vi.unstubAllGlobals()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const sections = [
  {
    id: 'example-app',
    role: 'The app',
    github: { owner: 'example-owner', name: 'example-app' },
    visibility: 'public',
    release: {
      tag: 'v1.0.0-beta.2',
      url: 'https://github.com/example-owner/example-app/releases/tag/v1.0.0-beta.2',
      publishedAt: '2026-11-21T10:00:00.000Z',
    },
    openPulls: 2,
    worktrees: 1,
    unread: [],
  },
  {
    id: 'example-lib',
    role: 'The library',
    github: { owner: 'example-owner', name: 'example-lib' },
    visibility: null,
    release: null,
    openPulls: null,
    worktrees: 3,
    unread: ['about', 'pulls'],
  },
  {
    id: 'local-notes',
    role: 'A local folder',
    github: null,
    visibility: null,
    release: null,
    openPulls: null,
    worktrees: 0,
    unread: [],
  },
]

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

/** example-app's CI numbers, read `hours` ago. */
const appCi = (hours: number, green = 18) => ({
  ci: {
    since: hoursAgo(24 * 30),
    runs: { green, finished: 20 },
    runMinutes: 6.5,
    merge: { count: 4, medianHours: 2, p90Hours: 5 },
    jobs: [],
    jobRuns: 0,
  },
  readAt: hoursAgo(hours),
  reading: false,
})

/** The Inbox fake of the last `withServer()`, which sends the feed's events. */
let inbox = fakeInboxServer({ items: [] })

/**
 * The fakes as the page's fetch: Alpha with three repositories and an empty Inbox; example-app's CI was read 3 hours
 * ago and example-lib's first CI read runs.
 */
function withServer() {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    {
      repositories: { alpha: sections },
      ci: {
        'alpha/example-app': appCi(3),
        'alpha/example-lib': { ci: null, readAt: null, reading: true },
      },
    },
  )
  inbox = fakeInboxServer({ items: [] })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
  return projects
}

async function open(path: string, width = 1440, height = 900) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })
  onTestFinished((await testRender(withInboxFeed(<RouterProvider router={router} />))).unmount)
  return router
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

const repoList = () => page.getByRole('list', { name: 'Repositories' })

describe("A project's Repositories tab (increment two)", () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`lists each repository with its facts and counts at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha', width, height)
      await userEvent.click(page.getByRole('tab', { name: 'Repositories' }))
      await expect.element(repoList().getByText('example-app')).toBeVisible()
      // The phone puts the counts after the meta, so the role keeps the row's width.
      const lines =
        width === 390
          ? [
              'The app · Public · v1.0.0-beta.2 · 2 open PRs · 1 worktree',
              'CI 18/20 green · 6.5 min a run · as of 3h ago',
              'The library · GitHub facts not read · Open PRs not read · 3 worktrees',
              'Reading CI',
              'A local folder · 0 worktrees',
            ]
          : [
              'The app · Public · v1.0.0-beta.2',
              '2 open PRs · 1 worktree',
              'CI 18/20 green · 6.5 min a run · as of 3h ago',
              'The library · GitHub facts not read',
              'Open PRs not read · 3 worktrees',
              'Reading CI',
              '0 worktrees',
            ]
      for (const text of lines) await expect.element(repoList().getByText(text, { exact: true })).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'repositories' })
      expect(projects.calls('repositories').map((r) => r.path)).toEqual(['/api/projects/alpha/repositories'])
      // A repository off GitHub has no CI to read.
      expect(projects.calls('ci').map((r) => r.path)).toEqual([
        '/api/projects/alpha/repositories/example-app/ci',
        '/api/projects/alpha/repositories/example-lib/ci',
      ])
      expect(getReports()).toEqual([])
    })
  }

  it('opens on the Repositories tab from its address, as a reload does', async () => {
    withServer()
    await open('/projects/alpha?tab=repositories')
    await expect.element(repoList().getByText('example-lib')).toBeVisible()
  })

  it('reads no repositories while the Overview tab shows', async () => {
    const projects = withServer()
    await open('/projects/alpha')
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
    expect(projects.calls('repositories')).toEqual([])
  })

  it('reads the CI numbers again on projects.changed, and a fresh read has no "as of"', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=repositories')
    await expect
      .element(repoList().getByText('CI 18/20 green · 6.5 min a run · as of 3h ago', { exact: true }))
      .toBeVisible()
    await expect.poll(() => inbox.streams()).toBe(1)
    projects.setCi('alpha', 'example-app', appCi(0, 19))
    projects.setCi('alpha', 'example-lib', {
      ...appCi(0),
      ci: { ...appCi(0).ci, runs: { green: 0, finished: 0 }, runMinutes: null },
    })
    inbox.emit('projects.changed')
    await expect.element(repoList().getByText('CI 19/20 green · 6.5 min a run', { exact: true })).toBeVisible()
    await expect.element(repoList().getByText('No finished CI runs in 30 days', { exact: true })).toBeVisible()
    expect(projects.calls('ci')).toHaveLength(4)
  })

  it('reads the CI numbers again when the page comes back from the background, as a projects.changed may be lost', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=repositories')
    await expect.element(repoList().getByText('Reading CI', { exact: true })).toBeVisible()
    await expect.poll(() => inbox.streams()).toBe(1)
    setHidden(true)
    await expect.poll(() => inbox.streams()).toBe(0)
    // The first CI read ends while the page is in the background: its projects.changed reaches no stream.
    projects.setCi('alpha', 'example-lib', appCi(0, 5))
    inbox.emit('projects.changed')
    setHidden(false)
    await expect.element(repoList().getByText('CI 5/20 green · 6.5 min a run', { exact: true })).toBeVisible()
  })

  it('says CI not read for a CI read that misses or a repository the server has no CI for, and keeps the rows', async () => {
    const projects = withServer()
    projects.answerNext('ci', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    projects.setCi('alpha', 'example-lib', { ci: null, readAt: null, reading: false })
    await open('/projects/alpha?tab=repositories')
    await expect.element(repoList().getByText('2 open PRs · 1 worktree', { exact: true })).toBeVisible()
    await expect.poll(() => repoList().getByText('CI not read', { exact: true }).elements().length).toBe(2)
    expect(getReports().map((r) => r.error.message)).toEqual(['A projects request missed: ci internal 500'])
  })

  it('keeps the CI numbers clear of the row text on the narrowest tablet layout (430 px)', async () => {
    withServer()
    await open('/projects/alpha?tab=repositories', 430, 932)
    await expect
      .element(repoList().getByText('CI 18/20 green · 6.5 min a run · as of 3h ago', { exact: true }))
      .toBeVisible()
    const box = (text: string) => repoList().getByText(text, { exact: true }).element().getBoundingClientRect()
    const list = repoList().element().getBoundingClientRect()
    const parts = [
      'example-app',
      'The app · Public · v1.0.0-beta.2',
      '2 open PRs · 1 worktree',
      'CI 18/20 green · 6.5 min a run · as of 3h ago',
    ].map(box)
    for (const [i, a] of parts.entries()) {
      expect([i, a.left >= list.left - 0.5 && a.right <= list.right + 0.5]).toEqual([i, true])
      for (const [k, b] of parts.entries()) {
        if (k <= i) continue
        const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        expect([i, k, apart]).toEqual([i, k, true])
      }
    }
  })

  it('says the repositories were not read when the read misses', async () => {
    const projects = withServer()
    projects.answerNext('repositories', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    await open('/projects/alpha?tab=repositories')
    await expect.element(page.getByRole('status')).toHaveTextContent('Repositories not read — the server answered 500')
    expect(getReports().map((r) => r.error.message)).toContain('A projects request missed: repositories internal 500')
  })
})
