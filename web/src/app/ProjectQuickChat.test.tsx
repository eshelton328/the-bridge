import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { maxPromptChars } from '@bridge/contract'
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

let startHeld: Promise<undefined> | undefined // A test's hold on POST /api/chats.

/** The fakes as the page's fetch, with the made-up project Alpha and its workspace. */
function withServer() {
  startHeld = undefined
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
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path === '/api/chats' && init?.method === 'POST') await startHeld
      const answer = projects.handle(path, init) ?? chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer === undefined) throw new TypeError(`no stub for ${url}`)
      // An answer that never comes ends on the request's signal, as fetch's does.
      const aborted = new Promise<never>((_, fail) => {
        init?.signal?.addEventListener('abort', () => {
          fail(new DOMException('Aborted', 'AbortError'))
        })
      })
      return Promise.race([answer, aborted])
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

  it('says a retry of a start that still runs (duplicateCreate) is starting, and keeps the text', async () => {
    const { workspaces, chats } = withServer()
    // The first answer is lost after the chat was made, so the server answers the retry 409 duplicateCreate.
    workspaces.answerNextStart(
      () => errorAnswer({ kind: 'internal', message: 'Failed', requestId: 'r-500' }, 500),
      true,
    )
    const { router, box } = await quickChat(1440, 900)
    await userEvent.click(box.getByRole('button', { name: 'Retry' }))
    await expect.element(box.getByRole('status')).toHaveTextContent('The chat is still starting; see Workspaces')
    await expect.element(box.getByRole('textbox', { name: 'First message' })).toHaveValue('Look at the open PRs')
    expect(workspaces.starts).toEqual([workspaces.starts[0], workspaces.starts[0]])
    expect(chats.prompts).toEqual([])
    expect(router.state.location.pathname).toBe('/projects/alpha')
  })

  it('keeps the text when a retried send answers duplicateSend after notSubmitted', async () => {
    const { chats } = withServer()
    chats.dropSubmits('test-box/new1', true)
    const { router, box } = await quickChat(1440, 900)
    await userEvent.click(box.getByRole('button', { name: 'Retry' }))
    await expect.element(box.getByRole('status')).toHaveTextContent('Not sent — chat not ready')
    await expect.element(box.getByRole('textbox', { name: 'First message' })).toHaveValue('Look at the open PRs')
    expect(router.state.location.pathname).toBe('/projects/alpha')
  })

  it('starts nothing for a text over the limit, says by how much, and keeps Send', async () => {
    const { workspaces } = withServer()
    const { box } = await quickChat(1440, 900, 'x'.repeat(maxPromptChars + 1))
    await expect.element(box.getByRole('status')).toHaveTextContent('Message too long — 1 character over')
    await expect.element(box.getByRole('button', { name: 'Send', exact: true })).toBeEnabled()
    expect(workspaces.starts).toEqual([])
  })

  it('changes nothing when a start answers after the dialog closed', async () => {
    const { workspaces } = withServer()
    let release: (value: undefined) => void = () => undefined
    startHeld = new Promise((done) => {
      release = done
    })
    const { went } = await quickChat(1440, 900)
    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    release(undefined)
    await expect.poll(() => workspaces.starts.length).toBe(1)
    await new Promise((done) => setTimeout(done, 500))
    // No navigation and no dialog again.
    expect([went, page.getByRole('dialog').elements()]).toEqual([[], []])
  })

  it('ends a send that gets no answer in a line with Retry, and opens the chat once it was sent', async () => {
    const { chats } = withServer()
    chats.answerPrompts(() => new Promise<Response>(() => undefined))
    const { router, box } = await quickChat(1440, 900)
    await expect.element(box.getByRole('status'), { timeout: 12_000 }).toHaveTextContent('Not sent — timeout')
    // The server took it after all: the Retry's duplicateSend reads `sent`, and the chat opens.
    chats.setSendResult('test-box/new1', chats.sendIds[0] ?? '', 'sent')
    await userEvent.click(box.getByRole('button', { name: 'Retry' }))
    await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  }, 20_000)
})
