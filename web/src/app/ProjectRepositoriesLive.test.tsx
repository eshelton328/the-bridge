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
// A live project's Repositories tab (f-008 increment two, R2, R8; the cards' head and stat tiles, d-135) with the
// contract-checked fakes only: the tab (`?tab=repositories`) draws a card for each repository, its name, visibility,
// role, Architecture and View on GitHub, and the tiles of its kept CI numbers (R4, with "as of" when the read is older
// than 10 minutes), open PRs and last drift check; it says which parts were not read, and the Overview reads none.
// The tab reads the numbers again on each `projects.changed`.
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

/** A drift run of `total` findings, as the server keeps a repository's last check. */
const driftRun = (total: number) => ({
  last: {
    result: 'findings',
    checkedAt: hoursAgo(1),
    commit: 'a'.repeat(40),
    findings: Array.from({ length: total }, (_, i) => ({
      kind: 'over-budget',
      path: `dir${String(i)}/AGENTS.md`,
      detail: '(165 > 60 lines)',
    })),
    total,
  },
})

/** The Architecture scope list: System and example-app, neither with a diagram yet. */
const scope = (id: string, title: string) => ({
  scope: id,
  title,
  commit: null,
  generatedAt: null,
  stale: false,
  running: false,
})

/** The Inbox fake of the last `withServer()`, which sends the feed's events. */
let inbox = fakeInboxServer({ items: [] })

/**
 * The fakes as the page's fetch: Alpha with three repositories and an empty Inbox; example-app's CI was read 3 hours
 * ago and example-lib's first CI read runs; example-app's last drift check found 17 problems, and example-lib has none.
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
      repositoryDrift: { 'alpha/example-app': driftRun(17) },
      architecture: {
        alpha: { scopes: [scope('@system', 'How the system works'), scope('example-app', 'example-app')] },
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
const card = (name: string) => repoList().getByRole('region', { name })

/** The card's stat tiles, each its label, value and caption, as a screen reader reads the definition list. */
const tilesOf = (name: string) =>
  [...card(name).element().querySelectorAll('dl')].map((dl) => [...dl.children].map((part) => part.textContent))

describe("A project's Repositories tab (increment two)", () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`draws each repository's head and stat tiles at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha', width, height)
      await userEvent.click(page.getByRole('tab', { name: 'Repositories' }))
      const app = card('example-app')
      await expect.element(app.getByRole('heading', { level: 2, name: 'example-app' })).toBeVisible()
      await expect.element(app.getByText('Public', { exact: true })).toBeVisible()
      await expect.element(app.getByText('v1.0.0-beta.2', { exact: true })).toBeVisible()
      await expect.element(app.getByText('The app', { exact: true })).toBeVisible()
      await expect.element(app.getByRole('button', { name: 'Architecture' })).toBeVisible()
      const github = app.getByRole('link', { name: width === 390 ? 'GitHub' : 'View on GitHub', exact: true })
      await expect.element(github).toBeVisible()
      await expect.element(github).toHaveAttribute('href', 'https://github.com/example-owner/example-app')
      await expect.element(github).toHaveAttribute('target', '_blank')
      await expect.element(github).toHaveAttribute('rel', 'noopener noreferrer')
      // The desktop draws five tiles; a tablet and the phone leave out CI run time, as their frames do.
      const runTime = width === 1440 ? [['CI run time', '6.5 min', 'median of green runs']] : []
      expect(tilesOf('example-app')).toEqual([
        ['CI pass rate', '90%', '18 of 20 runs · as of 3h ago'],
        ['PR merge time', '2.0 h', 'median · p90 5.0 h'],
        ...runTime,
        ['Open PRs', '2', '1 worktree'],
        ['Drift findings', '17', 'at the last check'],
      ])
      // example-lib's first CI read runs, its PRs and GitHub facts were not read, and it was never checked.
      await expect.element(card('example-lib').getByText('The library · GitHub facts not read')).toBeVisible()
      expect(tilesOf('example-lib')).toEqual([
        ['CI pass rate', 'Reading CI'],
        ['PR merge time', 'Reading CI'],
        ...(width === 1440 ? [['CI run time', 'Reading CI']] : []),
        ['Open PRs', 'Not read', '3 worktrees'],
        ['Drift findings', 'None', 'No check yet'],
      ])
      // A repository off GitHub has no tiles and no GitHub link; its worktree count shows under its head.
      const local = card('local-notes')
      await expect.element(local.getByText('0 worktrees', { exact: true })).toBeVisible()
      expect(tilesOf('local-notes')).toEqual([])
      expect(local.getByRole('link').elements()).toHaveLength(0)
      await expect.element(local.getByRole('button', { name: 'Architecture' })).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'repositories' })
      expect(projects.calls('repositories').map((r) => r.path)).toEqual(['/api/projects/alpha/repositories'])
      // A repository off GitHub has no CI and no snapshot to read.
      expect(projects.calls('ci').map((r) => r.path)).toEqual([
        '/api/projects/alpha/repositories/example-app/ci',
        '/api/projects/alpha/repositories/example-lib/ci',
      ])
      expect(projects.calls('repositoryDrift').map((r) => r.path)).toEqual([
        '/api/projects/alpha/repositories/example-app/drift',
        '/api/projects/alpha/repositories/example-lib/drift',
      ])
      expect(getReports()).toEqual([])
    })
  }

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    it(`opens the Architecture tab on the repository from its card's Architecture at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha?tab=repositories', width, height)
      await userEvent.click(card('example-app').getByRole('button', { name: 'Architecture' }))
      await expect.poll(() => router.state.location.search).toEqual({ tab: 'architecture', scope: 'example-app' })
      await expect
        .poll(() => projects.calls('diagram').map((r) => r.path))
        .toEqual(['/api/projects/alpha/architecture/example-app'])
      expect(getReports()).toEqual([])
    })
  }

  it('opens on the Repositories tab from its address, as a reload does', async () => {
    withServer()
    await open('/projects/alpha?tab=repositories')
    await expect.element(card('example-lib').getByRole('heading', { name: 'example-lib' })).toBeVisible()
  })

  it('reads no repositories while the Overview tab shows', async () => {
    const projects = withServer()
    await open('/projects/alpha')
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
    expect(projects.calls('repositories')).toEqual([])
    expect(projects.calls('repositoryDrift')).toEqual([])
  })

  it('reads the numbers again on projects.changed, and a fresh read has no "as of"', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=repositories')
    await expect.element(card('example-app').getByText('18 of 20 runs · as of 3h ago', { exact: true })).toBeVisible()
    await expect.poll(() => inbox.streams()).toBe(1)
    projects.setCi('alpha', 'example-app', appCi(0, 19))
    projects.setCi('alpha', 'example-lib', {
      ...appCi(0),
      ci: { ...appCi(0).ci, runs: { green: 0, finished: 0 }, runMinutes: null },
    })
    projects.setRepositoryDrift('alpha', 'example-lib', driftRun(4))
    inbox.emit('projects.changed')
    await expect.element(card('example-app').getByText('19 of 20 runs', { exact: true })).toBeVisible()
    await expect.element(card('example-lib').getByText('No finished CI runs in 30 days', { exact: true })).toBeVisible()
    expect(tilesOf('example-app')[0]).toEqual(['CI pass rate', '95%', '19 of 20 runs'])
    expect(tilesOf('example-lib')).toEqual([
      ['CI pass rate', 'None', 'No finished CI runs in 30 days'],
      ['PR merge time', '2.0 h', 'median · p90 5.0 h'],
      ['CI run time', 'None', 'No green run in 30 days'],
      ['Open PRs', 'Not read', '3 worktrees'],
      ['Drift findings', '4', 'at the last check'],
    ])
    expect(projects.calls('ci')).toHaveLength(4)
    expect(projects.calls('repositoryDrift')).toHaveLength(4)
  })

  it('reads the CI numbers again when the page comes back from the background, as a projects.changed may be lost', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=repositories')
    await expect.element(card('example-lib').getByText('Reading CI', { exact: true }).first()).toBeVisible()
    await expect.poll(() => inbox.streams()).toBe(1)
    setHidden(true)
    await expect.poll(() => inbox.streams()).toBe(0)
    // The first CI read ends while the page is in the background: its projects.changed reaches no stream.
    projects.setCi('alpha', 'example-lib', appCi(0, 5))
    inbox.emit('projects.changed')
    setHidden(false)
    await expect.element(card('example-lib').getByText('5 of 20 runs', { exact: true })).toBeVisible()
    expect(tilesOf('example-lib')[0]).toEqual(['CI pass rate', '25%', '5 of 20 runs'])
  })

  it('says CI not read for a CI read that misses or a repository the server has no CI for, and keeps the cards', async () => {
    const projects = withServer()
    projects.answerNext('ci', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    projects.setCi('alpha', 'example-lib', { ci: null, readAt: null, reading: false })
    await open('/projects/alpha?tab=repositories')
    await expect.element(card('example-app').getByText('1 worktree', { exact: true })).toBeVisible()
    // Each CI tile of both cards: pass rate, merge time and run time.
    await expect.poll(() => repoList().getByText('CI not read', { exact: true }).elements().length).toBe(6)
    expect(tilesOf('example-app').slice(0, 3)).toEqual([
      ['CI pass rate', 'CI not read'],
      ['PR merge time', 'CI not read'],
      ['CI run time', 'CI not read'],
    ])
    expect(getReports().map((r) => r.error.message)).toEqual(['A projects request missed: ci internal 500'])
  })

  it('says a drift check not read, or one that did not run, in the Drift findings tile', async () => {
    const projects = withServer()
    projects.answerNext('repositoryDrift', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    projects.setRepositoryDrift('alpha', 'example-lib', {
      last: { result: 'failed', checkedAt: hoursAgo(1), commit: null, findings: [], total: 0 },
    })
    await open('/projects/alpha?tab=repositories')
    await expect.element(card('example-lib').getByText('The check did not run', { exact: true })).toBeVisible()
    expect(tilesOf('example-app').at(-1)).toEqual(['Drift findings', 'Not read'])
    expect(tilesOf('example-lib').at(-1)).toEqual(['Drift findings', 'None', 'The check did not run'])
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A projects request missed: repositoryDrift internal 500',
    ])
  })

  it('keeps the head and the tiles apart and inside the list on the narrowest tablet layout (430 px)', async () => {
    withServer()
    await open('/projects/alpha?tab=repositories', 430, 932)
    const app = card('example-app')
    await expect.element(app.getByText('18 of 20 runs · as of 3h ago', { exact: true })).toBeVisible()
    const list = repoList().element().getBoundingClientRect()
    const parts = [
      app.getByRole('heading', { name: 'example-app' }).element(),
      app.getByText('The app', { exact: true }).element(),
      app.getByRole('button', { name: 'Architecture' }).element(),
      app.getByRole('link').element(),
      ...app.element().querySelectorAll('dl'),
    ].map((el) => el.getBoundingClientRect())
    expect(parts).toHaveLength(8)
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
