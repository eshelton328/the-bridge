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

// A live project's QA tab (f-008 increment three, R1 to R4; the live slice, NCC-155) with the contract-checked fakes
// only: the tab (`?tab=qa`) lists the items that wait for the owner's check in their two groups, and the
// Overview reads none.
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

/** A QA item of the contract: its issue, title, group, repository, PR, status and worktree. */
const item = (
  issue: string,
  title: string,
  phase: string,
  repository: string | null,
  pr: number | null,
  status: string,
  worktree: string,
) => ({
  issue,
  title,
  phase,
  repository,
  pr,
  status,
  worktree,
  comments: 2,
  askedAt: '2026-11-27T10:00:00.000Z',
  issueUrl: `https://linear.app/example/issue/${issue}`,
  launch: { url: null, blocked: null },
})
const items = [
  item('NCC-7', 'Add the QA tab', 'beforeMerge', 'example-app', 607, 'waiting', 'stopped'),
  item('NCC-3', 'Fix the composer glide', 'afterMerge', null, null, 'changesRequested', 'servedApp'),
]

/** The fakes as the page's fetch: Alpha with two QA items and an empty Inbox. */
function withServer() {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    { qa: { alpha: items } },
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

const group = (name: string) => page.getByRole('list', { name })

describe("A project's QA tab (increment three)", () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`lists the items in their groups with their issue, repository, status and worktree at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha', width, height)
      await expect.element(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
      const tabs = page
        .getByRole('tab')
        .elements()
        .map((t) => t.textContent)
      expect(tabs).toEqual(['Overview', 'Repositories', 'Architecture', 'QA', 'Ideas'])
      await userEvent.click(page.getByRole('tab', { name: 'QA' }))
      await expect.element(group('Before merge').getByText('Add the QA tab')).toBeVisible()
      await expect.element(group('After merge').getByText('Fix the composer glide')).toBeVisible()
      // The phone puts the status and the worktree after the meta, as the Repositories tab puts its counts.
      const lines: [string, string][] =
        width === 390
          ? [
              ['Before merge', 'NCC-7 · example-app#607 · Waiting · Stopped'],
              ['After merge', 'NCC-3 · Changes requested · Served app'],
            ]
          : [
              ['Before merge', 'NCC-7 · example-app#607'],
              ['Before merge', 'Waiting · Stopped'],
              ['After merge', 'NCC-3'],
              ['After merge', 'Changes requested · Served app'],
            ]
      for (const [name, text] of lines) await expect.element(group(name).getByText(text, { exact: true })).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'qa' })
      expect(projects.calls('qa').map((r) => r.path)).toEqual(['/api/projects/alpha/qa'])
      expect(getReports()).toEqual([])
    })
  }

  it('keeps Ideas in reach on the phone, where the four tabs run past the edge', async () => {
    withServer()
    const router = await open('/projects/alpha', 390, 844)
    await userEvent.click(page.getByRole('tab', { name: 'Ideas' }))
    await expect.poll(() => router.state.location.search).toEqual({ tab: 'ideas' })
  })

  it('reads no QA items while the Overview tab shows', async () => {
    const projects = withServer()
    await open('/projects/alpha')
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
    expect(projects.calls('qa')).toEqual([])
  })

  it('says so when nothing waits for a check', async () => {
    const projects = withServer()
    projects.answerNext('qa', () => Response.json({ items: [] }))
    await open('/projects/alpha?tab=qa') // the address opens the tab, as a reload does
    await expect.element(page.getByText('Nothing waits for your check')).toBeVisible()
  })

  it('says the QA items were not read when Linear is not there (503)', async () => {
    const projects = withServer()
    projects.answerNext('qa', () =>
      errorAnswer({ kind: 'linear-unavailable', message: 'Linear does not answer', requestId: 'r-503' }, 503),
    )
    await open('/projects/alpha?tab=qa')
    await expect.element(page.getByRole('status')).toHaveTextContent('QA items not read — the server answered 503')
    expect(getReports().map((r) => r.error.message)).toContain('A projects request missed: qa linear-unavailable 503')
  })
})
