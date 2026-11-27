import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// A live project's Context drift panel (f-008 R9, NCC-131) with the contract-checked fakes only: the last check's
// time and findings from GET /api/projects/:slug/drift, and Run check's POST, busy until the run answers.
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

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString()
const findings = {
  result: 'findings',
  checkedAt: minutesAgo(5),
  findings: [{ text: 'not a git clone: projects/alpha/notes.log' }, { text: 'no commit-msg hook in alpha-web' }],
}

/**
 * The fakes as the page's fetch: Alpha, with `drift` as its last run (none when not given), and an empty Inbox. With
 * `hold`, each request waits for its promise before the fakes see it, as a slow runner can delay the page's fetch.
 */
function withServer(drift?: unknown, hold: () => Promise<void> = () => Promise.resolve()) {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    {
      drift: drift === undefined ? {} : { alpha: drift },
    },
  )
  const inbox = fakeInboxServer({ items: [] })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    await hold()
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
  return projects
}

async function openAlpha(width = 1440, height = 900) {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects/alpha'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.element(drift()).toBeVisible()
}

const drift = () => page.getByRole('region', { name: 'Context drift' })
const runButton = () => drift().getByRole('button', { name: /Run check|Checking/ })
const rows = () =>
  [...document.querySelectorAll('section[aria-label="Context drift"] .list-row__title')].map((el) => el.textContent)
const internal = () => errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500)
const box = (panel: string) => document.querySelector(`section[aria-label="${panel}"]`)?.getBoundingClientRect()

describe("A project's Context drift panel (R9)", () => {
  it("shows the last check's findings and its time (AC1)", async () => {
    withServer(findings)
    await openAlpha()
    await expect.element(drift().getByText('Checked 5m ago')).toBeVisible()
    expect(rows()).toEqual(['not a git clone: projects/alpha/notes.log', 'no commit-msg hook in alpha-web'])
    await expect.element(runButton()).toHaveTextContent('Run check')
    await expect.element(runButton()).toBeEnabled()
    expect(getReports()).toEqual([])
  })

  it('says when no run, a clean run or a failed run found nothing', async () => {
    withServer()
    await openAlpha()
    await expect.element(drift().getByText('Not checked yet')).toBeVisible()
    await unmountRendered()
    withServer({ result: 'clean', checkedAt: minutesAgo(120), findings: [] })
    await openAlpha()
    await expect.element(drift().getByText('No drift found')).toBeVisible()
    await expect.element(drift().getByText('Checked 2h ago')).toBeVisible()
    await unmountRendered()
    withServer({ result: 'failed', checkedAt: minutesAgo(3), findings: [] })
    await openAlpha()
    await expect.element(drift().getByText('The check did not run')).toBeVisible()
  })

  it('posts Run check, keeps the button busy while the run is slow, then shows the new result (AC2)', async () => {
    // The page is busy before its POST reaches the fakes (NCC-157): the gate holds every request after the page opens.
    let open: () => void = () => undefined
    const gate = new Promise<void>((r) => (open = r))
    let held = false
    const server = withServer(findings, () => (held ? gate : Promise.resolve()))
    await openAlpha()
    held = true
    let resolve: (r: Response) => void = () => undefined
    const slow = new Promise<Response>((r) => (resolve = r))
    server.answerNext('runDrift', () => slow)
    await userEvent.click(runButton())
    await expect.element(runButton()).toHaveTextContent('Checking…')
    await expect.element(runButton()).toBeDisabled()
    await expect.element(drift()).toHaveAttribute('aria-busy', 'true')
    expect(server.calls('runDrift')).toEqual([])
    open()
    await expect
      .poll(() => server.calls('runDrift'))
      .toEqual([{ call: 'runDrift', path: '/api/projects/alpha/drift', body: {} }])
    resolve(Response.json({ last: { result: 'clean', checkedAt: new Date().toISOString(), findings: [] } }))
    await expect.element(drift().getByText('No drift found')).toBeVisible()
    await expect.element(drift().getByText('Checked just now')).toBeVisible()
    expect(rows()).toEqual([])
    await expect.element(runButton()).toHaveTextContent('Run check')
    await expect.element(runButton()).toBeEnabled()
    await expect.element(drift()).toHaveAttribute('aria-busy', 'false')
  })

  it('says the drift was not read when its read misses, and still shows the rest of the page', async () => {
    const server = withServer(findings)
    server.answerNext('drift', internal)
    await openAlpha()
    await expect.element(drift().getByRole('status')).toHaveTextContent('Drift not read — the server answered 500')
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toContain('A projects request missed: drift internal 500')
  })

  it('keeps the last findings and says the check did not run when Run check misses', async () => {
    const server = withServer(findings)
    await openAlpha()
    server.answerNext('runDrift', internal)
    await userEvent.click(runButton())
    await expect.element(drift().getByRole('status')).toHaveTextContent('Check not run — the server answered 500')
    expect(rows()).toHaveLength(2)
    await expect.element(runButton()).toBeEnabled()
  })

  it('draws the panel under the Inbox and Queue, across both columns at 1440 and under the Queue on a tablet or phone', async () => {
    withServer(findings)
    await openAlpha(1440, 900)
    const [inbox, queue, panel] = [box('Inbox'), box('Queue'), box('Context drift')]
    expect(panel?.left).toBe(inbox?.left)
    expect(panel?.right).toBe(queue?.right)
    expect((panel?.top ?? 0) > (queue?.bottom ?? 0)).toBe(true)
    for (const [width, height] of [
      [1024, 1366],
      [390, 844],
    ] as const) {
      await unmountRendered()
      await openAlpha(width, height)
      expect(box('Context drift')?.left).toBe(box('Queue')?.left)
      expect((box('Context drift')?.top ?? 0) > (box('Queue')?.bottom ?? 0)).toBe(true)
    }
  })
})
