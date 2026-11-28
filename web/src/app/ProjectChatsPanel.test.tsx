import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { brainItem, quiet, withInboxFeed } from './inboxLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// A live project's Chats panel (f-008 R7, NCC-130 B1) with the contract-checked fakes only: each herdr chat tagged
// with the project, in the server's order, read with the page, on each stream open and on workspaces.changed while the
// Overview is open (NCC-149); chat.status changes one pill with no read.
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

const tags = [{ key: 'project', value: 'alpha' }]
const chat = (n: number, title: string, status: string, label: string) => ({
  ...{ id: `test-box/c${String(n)}`, kind: 'claude', title, model: null, contextUsed: null, status },
  ...{ pane: `test-box/p${String(n)}`, workspace: { id: `test-box/w-${label}`, label }, tags },
})
const chats = [
  chat(2, 'Sample chat that needs you', 'needsYou', 'alpha'),
  chat(1, 'Sample working chat', 'working', 'alpha-docs'),
  chat(3, 'Sample done chat', 'done', 'alpha'),
  { ...chat(4, 'Sample shell', 'idle', 'alpha'), kind: 'shell' },
]

/** The fakes as the page's fetch: Alpha with `list` as its chats, and an Inbox with one of its items. */
function withServer(list: readonly unknown[] = chats) {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    { chats: { alpha: list } },
  )
  const inbox = fakeInboxServer({ items: [{ ...brainItem(1, 'Sample request of Alpha', 60), project: 'alpha' }] })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
  return { projects, inbox }
}

async function openAlpha(width = 1440, height = 900) {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects/alpha'] }) })
  const went: string[] = []
  onTestFinished(router.history.subscribe(({ location }) => went.push(location.href)))
  // StrictMode as mountApp.ts renders the app: it runs each effect's cleanup once on mount.
  const view = await testRender(
    withInboxFeed(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    ),
  )
  onTestFinished(view.unmount)
  await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
  return { went }
}

const panel = () => page.getByRole('region', { name: 'Chats' })
const titles = () =>
  [...document.querySelectorAll('section[aria-label="Chats"] .list-row__title')].map((el) => el.textContent)
const box = (name: string) =>
  document.querySelector(`section[aria-label="${name}"]`)?.lastElementChild?.getBoundingClientRect()

// Opens Alpha and waits for the stream's first read, so the count of chats reads stands still.
async function settled(server: ReturnType<typeof withServer>) {
  await openAlpha()
  await expect.poll(() => server.inbox.streams()).toBe(1)
  await quiet()
  return server.projects.calls('chats').length
}

const reads = (server: ReturnType<typeof withServer>) => server.projects.calls('chats').length

describe("A project's Chats panel (R7)", () => {
  it("lists the project's chats in the server's order with their workspace and status; a press opens one", async () => {
    withServer()
    const { went } = await openAlpha()
    await expect.poll(titles).toEqual(['Sample chat that needs you', 'Sample working chat', 'Sample done chat'])
    await expect.element(panel().getByText('alpha-docs', { exact: true })).toBeVisible()
    for (const word of ['Needs you', 'Working', 'Done'])
      await expect.element(panel().getByText(word, { exact: true })).toBeVisible()
    expect(getReports()).toEqual([])
    await userEvent.click(panel().getByRole('button', { name: /Sample working chat/ }))
    await expect.poll(() => went).toContain(`/workspaces?chat=${encodeURIComponent('test-box/c1')}`)
  })

  it('says so in one line when no chat is tagged with the project', async () => {
    withServer([])
    await openAlpha()
    await expect.element(panel().getByText('No chats tagged with this project')).toBeVisible()
  })

  it('says the chats were not read when the read misses, and still shows the Inbox and Queue', async () => {
    const { projects } = withServer()
    projects.answerNext('chats', () => errorAnswer({ kind: 'internal', message: 'Error', requestId: 'r-500' }, 500))
    await openAlpha()
    await expect.element(panel().getByRole('status')).toHaveTextContent('Chats not read — the server answered 500')
    await expect.element(page.getByRole('region', { name: 'Inbox' }).getByText('Sample request of Alpha')).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toContain('A projects request missed: chats internal 500')
  })

  it('reads the chats once more for each workspaces.changed while the Overview is open, and none on the Ideas tab', async () => {
    const server = withServer()
    const before = await settled(server)
    server.inbox.emit('workspaces.changed')
    await expect.poll(() => reads(server)).toBe(before + 1)
    await quiet()
    server.inbox.emit('workspaces.changed')
    await expect.poll(() => reads(server)).toBe(before + 2)
    await quiet()
    // The Ideas tab's loader reads the project again, but not its chats.
    await userEvent.click(page.getByRole('tab', { name: 'Ideas' }))
    server.inbox.emit('workspaces.changed')
    await quiet()
    expect(reads(server)).toBe(before + 2)
  })

  it('reads no chats on inbox.changed, and reads the Inbox panel as before', async () => {
    const server = withServer()
    const before = await settled(server)
    const lists = server.inbox.calls('list').length
    server.inbox.emit('inbox.changed')
    await expect.poll(() => server.inbox.calls('list').length).toBe(lists + 1)
    await quiet()
    expect(reads(server)).toBe(before)
  })

  it("changes only that chat's pill on chat.status, with no read; an unknown chat or a bad frame changes nothing", async () => {
    const server = withServer()
    const before = await settled(server)
    const pills = () =>
      (['Needs you', 'Working', 'Done'] as const).map((w) => panel().getByText(w, { exact: true }).elements().length)
    expect(pills()).toEqual([1, 1, 1])
    server.inbox.emit('chat.status', { chat: 'test-box/c1', status: 'done' })
    await expect.poll(pills).toEqual([1, 0, 2])
    server.inbox.emit('chat.status', { chat: 'test-box/c99', status: 'working' })
    server.inbox.emit('chat.status', { chat: 'test-box/c2', status: 'not-a-status' })
    await quiet()
    expect(pills()).toEqual([1, 0, 2])
    expect(reads(server)).toBe(before)
    expect(getReports()).toEqual([])
  })

  it('keeps a chat.status that comes during a chats read when the read answers', async () => {
    const server = withServer()
    const before = await settled(server)
    const pills = () =>
      (['Needs you', 'Working', 'Done'] as const).map((w) => panel().getByText(w, { exact: true }).elements().length)
    const gate: { open?: () => void } = {}
    const held = new Promise<void>((resolve) => {
      gate.open = resolve
    })
    // The read answers with the list from before the status change: c1 still working.
    server.projects.answerNext('chats', () => held.then(() => Response.json({ chats })))
    server.inbox.emit('workspaces.changed')
    await expect.poll(() => reads(server)).toBe(before + 1)
    server.inbox.emit('chat.status', { chat: 'test-box/c1', status: 'done' })
    await expect.poll(pills).toEqual([1, 0, 2])
    gate.open?.()
    await quiet()
    expect(pills()).toEqual([1, 0, 2])
  })

  it('gives exactly one more read for two workspaces.changed that come during one held read', async () => {
    const server = withServer()
    const before = await settled(server)
    const gate: { open?: () => void } = {}
    const held = new Promise<void>((resolve) => {
      gate.open = resolve
    })
    server.projects.answerNext('chats', () => held.then(() => Response.json({ chats })))
    server.inbox.emit('workspaces.changed')
    await expect.poll(() => reads(server)).toBe(before + 1)
    for (let i = 0; i < 2; i += 1) {
      server.inbox.emit('workspaces.changed')
      await quiet()
    }
    expect(reads(server)).toBe(before + 1)
    gate.open?.()
    await expect.poll(() => reads(server)).toBe(before + 2)
    await quiet()
    expect(reads(server)).toBe(before + 2)
  })

  it('leaves no unhandled error when the page closes during an Inbox read after a change', async () => {
    const server = withServer()
    await settled(server)
    const stop: { abort?: (e: unknown) => void } = {}
    server.inbox.answerNext('list', () => new Promise<Response>((_, reject) => (stop.abort = reject)))
    server.inbox.emit('inbox.changed')
    await expect.poll(() => stop.abort).toBeDefined()
    await unmountRendered()
    stop.abort?.(new DOMException('The operation was aborted.', 'AbortError'))
    await quiet() // Vitest fails the run on an unhandled rejection.
  })

  it('draws the panel full width under the two columns at 1440, and last at 1024 and 390', async () => {
    withServer()
    await openAlpha(1440, 900)
    await expect.poll(() => titles().length).toBe(3)
    const [inbox, queue, mine] = [box('Inbox'), box('Queue'), box('Chats')]
    expect([mine?.left, mine?.right]).toEqual([inbox?.left, queue?.right])
    expect((mine?.top ?? 0) > Math.max(inbox?.bottom ?? 0, queue?.bottom ?? 0)).toBe(true)
    for (const [width, height] of [
      [1024, 1366],
      [390, 844],
    ] as const) {
      await unmountRendered()
      await openAlpha(width, height)
      await expect.poll(() => titles().length).toBe(3)
      const last = document.querySelector('[data-figma="overview panels"] > section:last-child')
      expect(last?.getAttribute('aria-label')).toBe('Chats')
      expect(box('Chats')?.left).toBe(box('Inbox')?.left)
    }
  })
})
