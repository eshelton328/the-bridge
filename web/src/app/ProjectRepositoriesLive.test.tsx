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
// read, and the Overview reads none.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
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

/** The fakes as the page's fetch: Alpha with three repositories and an empty Inbox. */
function withServer() {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    { repositories: { alpha: sections } },
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
              'The library · GitHub facts not read · Open PRs not read · 3 worktrees',
              'A local folder · 0 worktrees',
            ]
          : [
              'The app · Public · v1.0.0-beta.2',
              '2 open PRs · 1 worktree',
              'The library · GitHub facts not read',
              'Open PRs not read · 3 worktrees',
              '0 worktrees',
            ]
      for (const text of lines) await expect.element(repoList().getByText(text, { exact: true })).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'repositories' })
      expect(projects.calls('repositories').map((r) => r.path)).toEqual(['/api/projects/alpha/repositories'])
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
