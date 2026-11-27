import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { brainItem, chatItem, quiet, withInboxFeed } from './inboxLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// A live project's Overview panels (f-008 R5, R6) with the contract-checked fakes only: the Inbox panel holds the
// project's items and loads again once per inbox.changed (NCC-138); the Queue panel its open PRs with their pills.
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

const mine = (n: number, title: string) => ({ ...brainItem(n, title, 60 * 24 * 5), project: 'alpha' })
const pull = (number: number, title: string, status: string) => ({
  repository: 'alpha-web',
  number,
  title,
  url: `https://github.com/example-owner/alpha-web/pull/${String(number)}`,
  branch: `dev/ncc-${String(number)}`,
  status,
  updatedAt: '2026-11-21T10:00:00.000Z',
})

/** The fakes as the page's fetch: Alpha with two open PRs and an unread repository, and an Inbox of `items`. */
function withServer(items: readonly unknown[]) {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    {
      queues: {
        alpha: {
          inProgress: [pull(12, 'Sample PR in review', 'inReview'), pull(11, 'Sample PR whose CI failed', 'ciFailed')],
          unread: ['alpha-docs'],
        },
      },
    },
  )
  const inbox = fakeInboxServer({ items })
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    const answer = projects.handle(path, init) ?? inbox.handle(path, init)
    if (answer === undefined) throw new TypeError(`no stub for ${url}`)
    return answer
  })
  return inbox
}

const items = [
  mine(1, 'Sample request of Alpha'),
  { ...brainItem(2, 'Sample request of another project', 30), project: 'beta' },
  chatItem(3, 'Sample chat question', 'question', 5),
  { ...mine(4, 'Sample snoozed request of Alpha'), needsYou: false, snoozedUntil: '2099-01-01T00:00:00.000Z' },
  { ...chatItem(6, 'Sample done chat of Alpha', 'review', 10), project: 'alpha' },
  chatItem(7, 'Sample done chat of no project', 'review', 15),
]

async function openAlpha(width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects/alpha'] }) })
  const view = await testRender(withInboxFeed(<RouterProvider router={router} />))
  onTestFinished(view.unmount)
  await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
}

const titles = (panel: string) =>
  [...document.querySelectorAll(`section[aria-label="${panel}"] .list-row__title`)].map((el) => el.textContent)
const box = (panel: string) =>
  document.querySelector(`section[aria-label="${panel}"]`)?.lastElementChild?.getBoundingClientRect()

describe("A project's Overview panels (R5, R6)", () => {
  it("shows only the project's items that need the owner, Needs you open and To review closed", async () => {
    withServer(items)
    await openAlpha(1440, 900)
    await expect.poll(() => titles('Inbox')).toEqual(['Sample request of Alpha'])
    const inbox = page.getByRole('region', { name: 'Inbox' })
    await expect.element(inbox.getByRole('button', { name: /Needs you/i })).toHaveAttribute('aria-expanded', 'true')
    await expect.element(inbox.getByRole('button', { name: /To review/i })).toHaveAttribute('aria-expanded', 'false')
    expect(getReports()).toEqual([])
  })

  it("lists the project's done chats under To review, not another project's or an untagged one", async () => {
    withServer(items)
    await openAlpha(1440, 900)
    await expect.poll(() => titles('Inbox')).toEqual(['Sample request of Alpha'])
    await userEvent.click(page.getByRole('region', { name: 'Inbox' }).getByRole('button', { name: /To review/i }))
    await expect.poll(() => titles('Inbox')).toEqual(['Sample request of Alpha', 'Sample done chat of Alpha'])
  })

  it('shows each open PR with its pill and the line of the repositories not read', async () => {
    withServer(items)
    await openAlpha(1440, 900)
    expect(titles('Queue')).toEqual(['Sample PR in review', 'Sample PR whose CI failed'])
    const queue = page.getByRole('region', { name: 'Queue' })
    await expect.element(queue.getByText('In review', { exact: true })).toBeVisible()
    await expect.element(queue.getByText('CI failed', { exact: true })).toBeVisible()
    await expect.element(queue.getByText('alpha-web#12', { exact: true })).toBeVisible()
    await expect.element(queue.getByText('PRs not read: alpha-docs')).toBeVisible()
    await userEvent.click(queue.getByRole('button', { name: /In progress/i }))
    expect(titles('Queue')).toEqual([])
  })

  it('draws the two panels side by side and as tall as each other at 1440, one over the other on a tablet or phone', async () => {
    withServer(items)
    await openAlpha(1440, 900)
    await expect.poll(() => titles('Inbox').length).toBe(1)
    const [inbox, queue] = [box('Inbox'), box('Queue')]
    expect(inbox?.top).toBe(queue?.top)
    expect(inbox?.height).toBe(queue?.height)
    expect((queue?.left ?? 0) > (inbox?.right ?? 0)).toBe(true)
    for (const [width, height] of [
      [1024, 1366],
      [390, 844],
    ] as const) {
      await unmountRendered()
      await openAlpha(width, height)
      expect(box('Queue')?.left).toBe(box('Inbox')?.left)
      expect((box('Queue')?.top ?? 0) > (box('Inbox')?.bottom ?? 0)).toBe(true)
    }
  })

  it('reads the Inbox twice on a cold load: the loader, then the feed as its stream opens', async () => {
    const inbox = withServer(items)
    await openAlpha(1440, 900)
    await expect.poll(() => inbox.streams()).toBe(1)
    await quiet()
    expect(inbox.calls('list')).toHaveLength(2)
  })

  it('reads the Inbox once when the page opens from the home and once for each inbox.changed', async () => {
    const inbox = withServer(items)
    await setViewport(1440, 900)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects'] }) })
    onTestFinished((await testRender(withInboxFeed(<RouterProvider router={router} />))).unmount)
    await expect.poll(() => inbox.streams()).toBe(1)
    await quiet()
    const home = inbox.calls('list').length
    await router.navigate({ to: '/projects/$slug', params: { slug: 'alpha' } })
    await expect.poll(() => titles('Inbox')).toEqual(['Sample request of Alpha'])
    await quiet()
    expect(inbox.calls('list').length - home).toBe(1)
    inbox.put(mine(5, 'Another sample request of Alpha'))
    await expect.poll(() => titles('Inbox')).toContain('Another sample request of Alpha')
    await quiet()
    expect(inbox.calls('list').length - home).toBe(2)
  })
})
