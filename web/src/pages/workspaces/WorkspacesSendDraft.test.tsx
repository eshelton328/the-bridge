import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { setViewport } from '../../lib/rendering.ts'
import { testRender } from '../../lib/testRender.ts'
import { resetAllStores } from '../../state/resetStores.ts'
import { loadWorkspacesRoute } from './loadWorkspacesState.ts'
import { workspacesSearch } from './search.ts'
import { WorkspacesPage } from './WorkspacesPage.tsx'
import { queryClient } from '../../lib/queryClient.ts'
import { workspacesStore } from './workspacesStore.ts'
import { answerLateServerReads } from '../../lib/lateServerReads.ts'

// Audit L-3 (library beta.90 `onSend`): on the owner's path, /workspaces > a chat in the list, the composer keeps the
// draft when the store's send rejects, and empties once a send succeeds. The page reports the failed send. The page
// entry, its loader and its store run as routes/workspaces.tsx wires them; a page may not import the app's route tree.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const chatName = 'bridge themes'

// The home's sample chats (?source=fixtures): in development the home reads the live source (d-117).
function renderAt(path = '/workspaces?source=fixtures') {
  const root = createRootRoute()
  const workspaces = createRoute({
    getParentRoute: () => root,
    path: 'workspaces',
    validateSearch: workspacesSearch,
    loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
    loader: ({ deps }) => loadWorkspacesRoute(deps.state, deps.source),
    component: WorkspacesPage,
  })
  const router = createRouter({
    routeTree: root.addChildren([workspaces]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return testRender(<RouterProvider router={router} />)
}

const region = (name: string) => page.getByRole('region', { name, exact: true })
const chat = () => region(chatName)
const box = () => chat().getByRole('textbox')
const sendButton = () => chat().getByRole('button', { name: 'Send', exact: true })

let view: { unmount: () => Promise<void> } | undefined

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  queryClient.clear()
  resetAllStores()
  clearReports()
  await setViewport(1512, 982)
})

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the desktop', size: [1512, 982] },
] as const

describe('a Workspaces chat keeps its draft until the send succeeds', () => {
  for (const device of devices) {
    it(`keeps the text after a failed send and empties the box after a sent one, on ${device.name}`, async () => {
      await setViewport(device.size[0], device.size[1])
      const send = vi.spyOn(workspacesStore.getState().actions, 'send')
      send.mockRejectedValueOnce(new Error('the chat server is down'))
      view = await renderAt()
      await userEvent.click(page.getByText(chatName, { exact: true }).first())
      await expect.element(box()).toBeVisible()
      await userEvent.fill(box(), 'keep this prompt')
      await userEvent.click(sendButton())
      await expect.poll(() => send.mock.calls.length).toBe(1)
      expect(send.mock.calls[0]?.[1]).toBe('keep this prompt')
      await expect.poll(() => getReports().map((r) => r.error.message)).toEqual(['the chat server is down'])
      await expect.element(sendButton()).toBeEnabled()
      await expect.element(box()).toHaveValue('keep this prompt')
      // The second send goes through the store's own send, which resolves.
      await userEvent.click(sendButton())
      await expect.poll(() => send.mock.calls.length).toBe(2)
      await expect.element(box()).toHaveValue('')
    })
  }

  it('keeps the saved draft after a failed send and drops it after a sent one (audit W-10)', async () => {
    await setViewport(390, 844)
    const saved = (): unknown => JSON.parse(window.sessionStorage.getItem('bridge/workspaces/drafts') ?? 'null')
    const send = vi.spyOn(workspacesStore.getState().actions, 'send')
    send.mockRejectedValueOnce(new Error('the chat server is down'))
    view = await renderAt()
    await userEvent.click(page.getByText(chatName, { exact: true }).first())
    await userEvent.fill(box(), 'keep this prompt')
    expect(saved()).toEqual({ state: null, drafts: { 'bridge-themes': 'keep this prompt' } })
    await userEvent.click(sendButton())
    await expect.poll(() => getReports().length).toBe(1)
    expect(saved()).toEqual({ state: null, drafts: { 'bridge-themes': 'keep this prompt' } })
    await userEvent.click(sendButton())
    await expect.element(box()).toHaveValue('')
    expect(saved()).toBeNull()
  })

  it('keeps what the owner typed while a send was pending, on the phone', async () => {
    await setViewport(390, 844)
    let resolve: () => void = () => undefined
    const send = vi.spyOn(workspacesStore.getState().actions, 'send')
    send.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    view = await renderAt()
    await userEvent.click(page.getByText(chatName, { exact: true }).first())
    await userEvent.fill(box(), 'first part')
    await userEvent.click(sendButton())
    await expect.poll(() => send.mock.calls.length).toBe(1)
    // Send is off while the send is pending; the box stays editable.
    await expect.element(sendButton()).toBeDisabled()
    await userEvent.fill(box(), 'first part, and more')
    resolve()
    await expect.element(sendButton()).toBeEnabled()
    await expect.element(box()).toHaveValue('first part, and more')
  })

  it('clears only the sent chat when the owner typed in another pane while the send was pending', async () => {
    let resolve: () => void = () => undefined
    const send = vi.spyOn(workspacesStore.getState().actions, 'send')
    send.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    view = await renderAt('/workspaces?state=twoPanes')
    const other = () => region('drift check').getByRole('textbox')
    await userEvent.fill(box(), 'send this')
    await userEvent.click(sendButton())
    await expect.poll(() => send.mock.calls.length).toBe(1)
    await userEvent.fill(other(), 'typed while it sent')
    resolve()
    await expect.element(box()).toHaveValue('')
    await expect.element(other()).toHaveValue('typed while it sent')
    // The page store keeps the drafts: a visit to another page and back shows the same.
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(other()).toHaveValue('typed while it sent')
    await expect.element(box()).toHaveValue('')
  })

  it('sends nothing to the store from a live Codex chat, whose composer is disabled (d-117, until W8)', async () => {
    await setViewport(390, 844)
    const send = vi.spyOn(workspacesStore.getState().actions, 'send')
    const body = JSON.stringify({
      machine: 'mac-mini',
      workspaces: [
        {
          id: 'mac-mini/w-live',
          label: 'live work',
          chats: [
            {
              id: 'mac-mini/p1',
              kind: 'codex',
              title: 'drift check',
              model: 'gpt-5.5',
              contextUsed: null,
              status: 'idle',
              modelId: null,
              effort: null,
              parent: null,
              pane: 'mac-mini/pane-p1',
            },
          ],
        },
      ],
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        // The workspace's layout (slice 3a) misses, so its panes are its first chats.
        if (url.endsWith('/layout')) return Promise.resolve(new Response('', { status: 503 }))
        return url.includes('/api/workspaces')
          ? Promise.resolve(new Response(body, { status: 200 }))
          : Promise.reject(new TypeError(`no stub for ${url}`))
      }),
    )
    // No ?source= and no ?state=: the live source (d-117).
    view = await renderAt('/workspaces')
    await userEvent.click(page.getByText('drift check', { exact: true }).first())
    const live = page.getByRole('textbox', { name: 'Sending not live yet' })
    await expect.element(live).toBeDisabled()
    await userEvent.click(live, { force: true })
    await userEvent.keyboard('hello{Enter}')
    await userEvent.click(page.getByRole('button', { name: 'Send', exact: true }), { force: true })
    expect(send).not.toHaveBeenCalled()
  })
})
