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
import { loadWorkspacesState } from './loadWorkspacesState.ts'
import { workspacesSearch } from './search.ts'
import { WorkspacesPage } from './WorkspacesPage.tsx'
import { workspacesStore } from './workspacesStore.ts'

// Audit L-3 (library beta.90 `onSend`): on the owner's path, /workspaces > a chat in the list, the composer keeps the
// draft when the store's send rejects, and empties once a send succeeds. The page reports the failed send. The page
// entry, its loader and its store run as routes/workspaces.tsx wires them; a page may not import the app's route tree.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const chatName = 'bridge themes'

function renderHome() {
  const root = createRootRoute()
  const workspaces = createRoute({
    getParentRoute: () => root,
    path: 'workspaces',
    validateSearch: workspacesSearch,
    loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
    loader: ({ deps }) => loadWorkspacesState(deps.state, deps.source),
    component: WorkspacesPage,
  })
  const router = createRouter({
    routeTree: root.addChildren([workspaces]),
    history: createMemoryHistory({ initialEntries: ['/workspaces'] }),
  })
  return testRender(<RouterProvider router={router} />)
}

const chat = () => page.getByRole('region', { name: chatName, exact: true })
const box = () => chat().getByRole('textbox')
const sendButton = () => chat().getByRole('button', { name: 'Send', exact: true })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.restoreAllMocks()
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
      view = await renderHome()
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
    view = await renderHome()
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
})
