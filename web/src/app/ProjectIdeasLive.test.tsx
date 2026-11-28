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
import { settingsStore } from '../state/settingsStore.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { withInboxFeed } from './inboxLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// A live project's Ideas tab and idea page (f-008 R10, R11; NCC-132's live slice) with the contract-checked fakes
// only: the tab (`?tab=ideas`) lists the project's idea records, the Overview reads none, a row opens its page
// (`?idea=`), and Back to Ideas returns.
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

const speech = '3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a01'
const tags = '3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a02'
const ideas = [
  {
    id: speech,
    title: 'Sample idea about speech',
    summary: 'Talk to a chat from the phone.',
    tags: ['voice'],
    kind: 'idea',
    state: 'in-design',
    updated: '2026-11-25T10:00:00.000Z',
  },
  {
    id: tags,
    title: 'Sample proposal about tags',
    summary: 'Tag each chat with its project.',
    tags: [],
    kind: 'proposal',
    state: 'open',
    updated: '2026-11-20T10:00:00.000Z',
  },
]
const body = '# Sample idea about speech\n\nTalk to a chat from the phone.\n\n## Open questions\n\n- Which engine?\n'
const tagsBody = '# Sample proposal about tags\n\n![A tag chart](https://example.com/tags.png)\n'

/** The fakes as the page's fetch: Alpha with two ideas and an empty Inbox. */
function withServer(list = ideas) {
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    {
      ideas: {
        alpha: list.map((idea) => ({
          idea,
          body: idea.id === speech ? body : tagsBody,
          file: `ideas/${idea.id}.md`,
        })),
      },
    },
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

const ideaList = () => page.getByRole('list', { name: 'Ideas' })

describe("A project's Ideas tab (R10)", () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`lists the ideas when the Ideas tab opens at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha', width, height)
      await userEvent.click(page.getByRole('tab', { name: 'Ideas' }))
      await expect.element(ideaList().getByText('Sample idea about speech')).toBeVisible()
      await expect.element(ideaList().getByText('Sample proposal about tags')).toBeVisible()
      await expect.element(ideaList().getByText('Idea · In design · voice')).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'ideas' })
      expect(projects.calls('ideas').map((r) => r.path)).toEqual(['/api/projects/alpha/ideas'])
      await userEvent.click(ideaList().getByText('Sample idea about speech'))
      await expect.element(page.getByRole('heading', { name: 'Sample idea about speech', level: 2 })).toBeVisible()
      await expect.element(page.getByText('Which engine?')).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'ideas', idea: speech })
      await userEvent.click(page.getByRole('button', { name: 'Back to Ideas' }))
      await expect.element(ideaList().getByText('Sample proposal about tags')).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'ideas' })
      expect(getReports()).toEqual([])
    })
  }

  it("opens an idea's page from its address, as a reload does", async () => {
    const projects = withServer()
    await open(`/projects/alpha?idea=${speech}`)
    await expect.element(page.getByRole('heading', { name: 'Sample idea about speech', level: 2 })).toBeVisible()
    expect(projects.calls('idea').map((r) => r.path)).toEqual([`/api/projects/alpha/ideas/${speech}`])
    // The record's Open questions list shows in its own panel (d-135, D09), and the text keeps no copy of it.
    const questions = page.getByRole('region', { name: 'Open questions' })
    await expect.element(questions.getByText('Which engine?')).toBeVisible()
    expect(page.getByText('Which engine?').elements()).toHaveLength(1)
    expect(projects.calls('chats')).toEqual([])
  })

  it("opens an idea's page on the Ideas tab when the address names another tab", async () => {
    const projects = withServer()
    await open(`/projects/alpha?tab=repositories&idea=${speech}`)
    await expect.element(page.getByRole('heading', { name: 'Sample idea about speech', level: 2 })).toBeVisible()
    expect(projects.calls('idea').map((r) => r.path)).toEqual([`/api/projects/alpha/ideas/${speech}`])
    expect(projects.calls('repositories')).toEqual([])
    expect(projects.calls('chats')).toEqual([])
  })

  it("draws an idea's image as a link when Settings turns images off", async () => {
    settingsStore.getState().actions.setRichText('images', false)
    withServer()
    await open(`/projects/alpha?idea=${tags}`)
    const idea = page.getByRole('article')
    await expect.element(idea.getByRole('heading', { name: 'Sample proposal about tags', level: 2 })).toBeVisible()
    await expect.element(idea.getByRole('link', { name: /A tag chart|tags\.png/ })).toBeVisible()
    expect(idea.getByRole('img').elements()).toEqual([])
  })

  it('says an idea ID the contract refuses is not found, with no read', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=ideas&idea=..%2Fchats')
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    expect(projects.calls('idea')).toEqual([])
    expect(projects.calls('chats')).toEqual([])
  })

  it('pages 16 ideas 10 at a time, and a search goes back to page 1 (AC1)', async () => {
    const many = Array.from({ length: 16 }, (_, n) => ({
      summary: '',
      tags: [],
      kind: 'proposal',
      state: 'open',
      updated: '2026-11-20T10:00:00.000Z',
      id: `3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d1${String(n).padStart(3, '0')}`,
      title: `Idea number ${String(n + 1)}`,
    }))
    withServer(many)
    await open('/projects/alpha?tab=ideas')
    await expect.element(page.getByText('1–10 of 16')).toBeVisible()
    expect(ideaList().getByRole('listitem').elements()).toHaveLength(10)
    await userEvent.click(page.getByRole('button', { name: 'Next page' }))
    await expect.element(page.getByText('11–16 of 16')).toBeVisible()
    expect(ideaList().getByRole('listitem').elements()).toHaveLength(6)
    await userEvent.fill(page.getByRole('searchbox', { name: 'Search ideas' }), 'number 1')
    await expect.element(page.getByText('1–8 of 8')).toBeVisible()
  })

  it('keeps the search, sort and page when Back to Ideas returns from an idea', async () => {
    withServer()
    await open('/projects/alpha?tab=ideas')
    const search = page.getByRole('searchbox', { name: 'Search ideas' })
    await userEvent.fill(search, 'tags')
    await expect.element(page.getByText('1–1 of 1')).toBeVisible()
    await userEvent.click(ideaList().getByText('Sample proposal about tags'))
    await expect.element(page.getByRole('heading', { name: 'Sample proposal about tags', level: 2 })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Back to Ideas' }))
    await expect.element(page.getByText('1–1 of 1')).toBeVisible()
    await expect.element(search).toHaveValue('tags')
    expect(ideaList().getByText('Sample idea about speech').elements()).toHaveLength(0)
  })

  it('says an idea the server does not know is not found', async () => {
    withServer()
    await open('/projects/alpha?tab=ideas&idea=3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a09')
    await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  it('opens on the Ideas tab from its address, as a reload does, and goes back to the Overview', async () => {
    withServer()
    const router = await open('/projects/alpha?tab=ideas')
    await expect.element(ideaList().getByText('Sample idea about speech')).toBeVisible()
    await userEvent.click(page.getByRole('tab', { name: 'Overview' }))
    await expect.poll(() => router.state.location.search).toEqual({})
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
  })

  it('reads no ideas while the Overview tab shows', async () => {
    const projects = withServer()
    await open('/projects/alpha')
    await expect.element(page.getByRole('region', { name: 'Queue' })).toBeVisible()
    expect(projects.calls('ideas')).toEqual([])
  })

  it('says the ideas were not read when the read misses', async () => {
    const projects = withServer()
    projects.answerNext('ideas', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    await open('/projects/alpha?tab=ideas')
    await expect.element(page.getByRole('status')).toHaveTextContent('Ideas not read — the server answered 500')
    expect(getReports().map((r) => r.error.message)).toContain('A projects request missed: ideas internal 500')
  })
})
