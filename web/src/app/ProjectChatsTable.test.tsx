import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports } from '../errors/reporter.ts'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Chats panel's search, area chips and pager (f-008 R7, NCC-130 AC3) on a live project with 18 tagged chats,
// with the contract-checked fakes only.
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

// 12 chats of area/bridge and 6 of area/library; chat 7 is the only one named "loading".
const chats = Array.from({ length: 18 }, (_, i) => ({
  ...{ id: `test-box/c${String(i + 1)}`, kind: 'claude', model: null, contextUsed: null, status: 'idle' },
  ...{ title: i === 6 ? 'Sample loading chat' : `Sample chat ${String(i + 1)}`, pane: `test-box/p${String(i + 1)}` },
  workspace: { id: 'test-box/w1', label: 'alpha' },
  tags: [
    { key: 'project', value: 'alpha' },
    { key: 'area', value: i < 12 ? 'bridge' : 'library' },
  ],
}))

function withServer(chatsAnswer?: () => Response) {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    { chats: { alpha: chats } },
  )
  if (chatsAnswer !== undefined) projects.answerNext('chats', chatsAnswer)
  const inbox = fakeInboxServer({ items: [] })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
}

async function openAlpha(width = 1440, height = 900) {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects/alpha'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.element(panel()).toBeVisible()
}

const panel = () => page.getByRole('region', { name: 'Chats' })
const rows = () =>
  [...document.querySelectorAll('section[aria-label="Chats"] .list-row__title')].map((el) => el.textContent)

describe("A project's Chats table (R7)", () => {
  it('shows 10 rows a page and the other 8 on page 2 (AC3)', async () => {
    withServer()
    await openAlpha()
    await expect.poll(rows).toHaveLength(10)
    await expect.element(panel().getByText('1–10 of 18')).toBeVisible()
    await userEvent.click(panel().getByRole('button', { name: 'Next page' }))
    await expect.poll(rows).toHaveLength(8)
    await expect.element(panel().getByText('11–18 of 18')).toBeVisible()
  })

  it('filters the rows with an area chip and with the search (AC3)', async () => {
    withServer()
    await openAlpha()
    await userEvent.click(panel().getByRole('button', { name: /area\/library/ }))
    await expect.poll(rows).toHaveLength(6)
    await expect.element(panel().getByText('1–6 of 6')).toBeVisible()
    await userEvent.click(panel().getByRole('button', { name: /area\/library/ }))
    await userEvent.fill(panel().getByRole('searchbox', { name: 'Search chats' }), 'loading')
    await expect.poll(rows).toEqual(['Sample loading chat'])
  })

  it('shows no count when the chats were not read', async () => {
    withServer(() => errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500))
    await openAlpha()
    await expect.element(panel().getByRole('status')).toHaveTextContent('Chats not read — the server answered 500')
    await expect.element(panel().getByRole('heading', { name: 'Chats' })).toBeVisible()
    expect(panel().getByText('0', { exact: true }).elements()).toEqual([])
  })
})
