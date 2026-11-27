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

// Quick chat on a live project's page (f-008 R8) with the contract-checked fakes only, never a real chat.
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

/** The fakes as the page's fetch, with the made-up project Alpha and its workspace. */
function withServer() {
  const projects = fakeProjectsServer([
    { slug: 'alpha', name: 'Alpha', purpose: 'Made up.', icon: null, pinned: false },
  ])
  const chats = fakeTranscriptServer()
  const workspaces = fakeWorkspacesServer(chats, {
    machine: 'test-box',
    workspaces: [{ id: 'test-box/w-alpha', label: 'alpha', chats: [] }],
  })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = projects.handle(path, init) ?? chats.handle(path, init) ?? workspaces.handle(path, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return { workspaces, chats }
}

/** Opens Alpha's page at the size, presses Quick chat, and sends `text`; `went` gets each place the router goes. */
async function quickChat(width: number, height: number, text = 'Look at the open PRs') {
  await setViewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects/alpha'] }) })
  const went: string[] = []
  onTestFinished(router.history.subscribe(({ location }) => went.push(location.href)))
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await userEvent.click(page.getByRole('button', { name: 'Quick chat' }))
  const box = page.getByRole('dialog', { name: 'Quick chat' })
  await expect.element(box).toBeVisible()
  // The Dialog opens over the page; the iPad's and the phone's tab bar stay.
  expect(document.querySelector('[data-figma="tab bar"]') !== null).toBe(width < 1232)
  await userEvent.fill(box.getByRole('textbox', { name: 'First message' }), text)
  await userEvent.click(box.getByRole('button', { name: 'Send', exact: true }))
  return { router, went, box }
}

describe('Quick chat (R8)', () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`starts a chat in the project's place and opens it in Workspaces at ${String(width)} px`, async () => {
      const { workspaces, chats } = withServer()
      const { router, went } = await quickChat(width, height)
      await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
      expect(went).toContain(`/workspaces?chat=${encodeURIComponent('test-box/new1')}`)
      await expect.element(page.getByText('chat-1', { exact: true }).first()).toBeVisible()
      // The project's place and a create ID only: no name, tag or first message.
      expect(workspaces.starts).toMatchObject([{ kind: 'claude', place: { in: 'project', project: 'alpha' } }])
      expect(Object.keys(workspaces.starts[0] ?? {})).toEqual(['kind', 'place', 'createId'])
      expect(chats.prompts).toEqual([{ chat: 'test-box/new1', text: 'Look at the open PRs' }])
      expect(getReports()).toEqual([])
    })
  }

  it('keeps the text and sends nothing when the new chat needs the owner', async () => {
    const { workspaces, chats } = withServer()
    workspaces.startAs('needsYou')
    const { router, box } = await quickChat(390, 844)
    await expect.element(box.getByRole('status')).toHaveTextContent('This chat needs you on the Mac')
    await expect.element(box.getByRole('textbox', { name: 'First message' })).toHaveValue('Look at the open PRs')
    expect(chats.prompts).toEqual([])
    expect(router.state.location.pathname).toBe('/projects/alpha')
  })

  it('retries a start that missed with the same create ID', async () => {
    const { workspaces, chats } = withServer()
    workspaces.answerNextStart(() => errorAnswer({ kind: 'internal', message: 'Failed', requestId: 'r-500' }, 500))
    const { router, box } = await quickChat(1440, 900)
    await expect.element(box.getByRole('status')).toHaveTextContent('Could not start the chat')
    await userEvent.click(box.getByRole('button', { name: 'Retry' }))
    await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
    expect(workspaces.starts).toEqual([workspaces.starts[0], workspaces.starts[0]])
    expect(chats.prompts).toEqual([{ chat: 'test-box/new1', text: 'Look at the open PRs' }])
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat start missed: internal 500'])
  })
})
