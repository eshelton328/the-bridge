import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { errorAnswer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// "Chat about this idea" on an idea's page (NCC-132 AC2): Quick chat's start in the project's place, then the
// prompt that names the idea's record, with the contract-checked fakes only, never a real chat.
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

const id = '3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a01'
const prompt =
  'Let\'s talk about the idea "Sample idea about speech". Its record is ' +
  '../../engine/projects/alpha/ideas/speech.md. Read it first, then ask me what I want to do with it.'

let startHeld: Promise<undefined> | undefined // A test's hold on POST /api/chats.

/** The fakes as the page's fetch: Alpha with one idea in `ideas/speech.md`, and its workspace. */
function withServer() {
  startHeld = undefined
  const projects = fakeProjectsServer(
    [{ slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false }],
    {
      ideas: {
        alpha: [
          {
            idea: {
              id,
              title: 'Sample idea about speech',
              summary: '',
              tags: [],
              kind: 'idea',
              state: 'open',
              updated: '2026-11-20T10:00:00.000Z',
            },
            body: '# Sample idea about speech\n\nTalk to a chat from the phone.\n',
            file: 'ideas/speech.md',
          },
        ],
      },
    },
  )
  const chats = fakeTranscriptServer()
  const workspaces = fakeWorkspacesServer(chats, {
    machine: 'test-box',
    workspaces: [{ id: 'test-box/w-alpha', label: 'alpha', chats: [] }],
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path === '/api/chats' && init?.method === 'POST') await startHeld
      const answer = projects.handle(path, init) ?? chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer === undefined) throw new TypeError(`no stub for ${url}`)
      return answer
    }),
  )
  return { workspaces, chats }
}

/** Opens the idea's page at the size and presses Chat about this idea. */
async function chatAboutIdea(width: number, height: number) {
  await setViewport(width, height)
  // The list, then the idea, so the browser's Back has a page to go to.
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/projects/alpha?tab=ideas', `/projects/alpha?tab=ideas&idea=${id}`],
      initialIndex: 1,
    }),
  })
  const went: string[] = []
  onTestFinished(router.history.subscribe(({ location }) => went.push(location.href)))
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  const button = page.getByRole('button', { name: 'Chat about this idea' })
  await userEvent.click(button)
  return { router, button, went }
}

describe('Chat about this idea (NCC-132 AC2)', () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`starts a chat in the project's place with the idea's record and opens it at ${String(width)} px`, async () => {
      const { workspaces, chats } = withServer()
      const { router, went } = await chatAboutIdea(width, height)
      await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
      expect(went).toContain(`/workspaces?chat=${encodeURIComponent('test-box/new1')}`)
      // The project's place and a create ID only, as Quick chat starts it; the record goes in the prompt.
      expect(workspaces.starts).toMatchObject([{ kind: 'claude', place: { in: 'project', project: 'alpha' } }])
      expect(Object.keys(workspaces.starts[0] ?? {})).toEqual(['kind', 'place', 'createId'])
      expect(chats.prompts).toEqual([{ chat: 'test-box/new1', text: prompt }])
      expect(getReports()).toEqual([])
    })
  }

  it('says the chat needs the owner, sends nothing and stays on the idea', async () => {
    const { workspaces, chats } = withServer()
    workspaces.startAs('needsYou')
    const { router } = await chatAboutIdea(390, 844)
    await expect.element(page.getByRole('status')).toHaveTextContent('This chat needs you on the Mac')
    expect(chats.prompts).toEqual([])
    expect(router.state.location.search).toEqual({ tab: 'ideas', idea: id })
  })

  it("opens no chat when the browser's Back leaves the idea during the start", async () => {
    const { chats } = withServer()
    const hold: { resolve: (value: undefined) => void } = { resolve: () => undefined }
    startHeld = new Promise<undefined>((resolve) => {
      hold.resolve = (value) => {
        resolve(value)
      }
    })
    const { router } = await chatAboutIdea(1440, 900)
    await expect.element(page.getByRole('button', { name: 'Chat about this idea' })).toBeDisabled()
    router.history.back()
    await expect.poll(() => router.state.location.search).toEqual({ tab: 'ideas' })
    hold.resolve(undefined)
    await expect.element(page.getByRole('list', { name: 'Ideas' })).toBeVisible()
    // The start's answer comes after the Back: the chat gets its prompt, and the page stays on the list.
    await expect.poll(() => chats.prompts).toEqual([{ chat: 'test-box/new1', text: prompt }])
    await new Promise((done) => setTimeout(done, 300))
    expect(router.state.location.pathname).toBe('/projects/alpha')
    expect(router.state.location.search).toEqual({ tab: 'ideas' })
  })

  it('retries a start that missed with the same create ID when pressed again', async () => {
    const { workspaces, chats } = withServer()
    workspaces.answerNextStart(() => errorAnswer({ kind: 'internal', message: 'Failed', requestId: 'r-500' }, 500))
    const { router, button } = await chatAboutIdea(1440, 900)
    await expect.element(page.getByRole('status')).toHaveTextContent('Could not start the chat')
    await userEvent.click(button)
    await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
    // The second start is the first one's body again, with its create ID.
    expect(workspaces.starts).toHaveLength(2)
    expect(workspaces.starts[1]).toEqual(workspaces.starts[0])
    expect(chats.prompts).toEqual([{ chat: 'test-box/new1', text: prompt }])
  })
})
